package main

import (
	"crypto/rand"
	_ "database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var SESSION = sessions.NewCookieStore([]byte(os.Getenv("SESSION_SECRET")))

type DataFile struct {
	gorm.Model
	DocumentId uint
	Name       string `sql:"type:text"`
	Body       string `sql:"type:text"`
}

type Notebook struct {
	gorm.Model
	DocumentId uint
	Name       string `sql:"type:text"`
	Body       string `sql:"type:text"`
}

type Document struct {
	gorm.Model
	Name     string `sql:"type:text"`
	Notebook Notebook
	DataFile DataFile
}

type Member struct {
	updated_on int64
	created_on int64
}

type Fellowship struct {
	Members  map[string]map[string]*Member
	Messages map[string]map[string]map[string][]string
	MX       sync.Mutex
}

type FellowshipUpdate struct {
	Timestamp int64
	Members   []string
	Messages  map[string][]string
}

var FELLOWSHIP = &Fellowship{}

func (f *Fellowship) Init() {
	f.Members = map[string]map[string]*Member{}
	f.Messages = map[string]map[string]map[string][]string{}
	f.MX = sync.Mutex{}
}

func (f *Fellowship) Put(group string, from string, to string, message string) {
	f.MX.Lock()
	defer f.MX.Unlock()

	if _, ok := f.Messages[group]; !ok {
		f.Messages[group] = map[string]map[string][]string{}
	}

	if _, ok := f.Messages[group][to]; !ok {
		f.Messages[group][to] = map[string][]string{}
	}

	if _, ok := f.Messages[group][to]; !ok {
		f.Messages[group][to][from] = []string{}
	}

	f.Messages[group][to][from] = append(f.Messages[group][to][from], message)
}

func (f *Fellowship) Get(group string, name string, last int64) *FellowshipUpdate {
	f.MX.Lock()
	defer f.MX.Unlock()

	fmt.Printf("last=%v\n", last)

	now := time.Now().Unix()

	if f.Members[group] == nil {
		f.Members[group] = map[string]*Member{}
	}

	if _, ok := f.Members[group][name]; !ok {
		f.Members[group][name] = &Member{created_on: now, updated_on: now}
	}

	f.Members[group][name].updated_on = now

	messages := map[string][]string{}
	if m, ok := f.Messages[group][name]; ok {
		messages = m
		f.Messages[group][name] = map[string][]string{}
	}

	update := &FellowshipUpdate{Members: []string{}, Messages: messages, Timestamp: now}

	for k := range f.Members[group] {
		if k != name && f.Members[group][k].created_on >= last {
			update.Members = append(update.Members, k)
		}
	}

	return update
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

func noStore(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func connectToDatabase() (DB gorm.DB) {
	var databaseURL = os.Getenv("DATABASE_URL")
	var url, _ = url.Parse(databaseURL)
	switch url.Scheme {
	case "sqlite3":
		DB, _ = gorm.Open(url.Scheme, url.Host)
	case "postgres":
		var host = url.Host
		var port = "5432"
		var hostChunks = strings.Split(host, ":")
		if len(hostChunks) == 2 {
			host = hostChunks[0]
			port = hostChunks[1]
		}
		var username = url.User.Username()
		var password, hasPas = url.User.Password()
		var db = strings.Trim(url.Path, "/")
		var constr string
		if hasPas {
			constr = fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable", username, password, host, port, db)
		} else {
			constr = fmt.Sprintf("user=%s host=%s port=%s dbname=%s sslmode=disable", username, host, port, db)
		}
		fmt.Printf("constr %s\n", constr)
		DB, _ = gorm.Open(url.Scheme, constr)
	default:
		fmt.Printf("unknown DATABASE_URL schema in %s\n", databaseURL)
		os.Exit(1)
	}
	DB.AutoMigrate(&Notebook{}, &DataFile{}, &Document{})
	return
}

var DB gorm.DB

func newDocument(w http.ResponseWriter, r *http.Request) {
	var document = Document{}
	body, _ := ioutil.ReadAll(r.Body)
	fmt.Printf("Post Document %v\n", body)
	json.Unmarshal(body, &document)
	DB.Create(&document)
	w.Write([]byte(fmt.Sprintf("/d/%d\n", document.ID)))
}

func updateDocument(user string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var id, _ = strconv.Atoi(vars["id"])

	var newDoc = Document{}

	body, _ := ioutil.ReadAll(r.Body)
	json.Unmarshal(body, &newDoc)

	var notebook = Notebook{}
	DB.First(&notebook, Notebook{DocumentId: uint(id)})
	notebook.Body = newDoc.Notebook.Body

	if notebook.Body != "" {
		DB.Save(&notebook)
		w.Write([]byte("ok"))
	} else {
		w.Write([]byte("err")) // TODO http error code
	}
}

func putFellowship(user string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Printf("PUT man!\n")
	r.ParseForm()
	fmt.Printf("PUT FORM %v\n", r.Form)
	to := r.Form["to"][0]
	message := r.Form["message"][0]
	FELLOWSHIP.Put(vars["id"], user, to, message)
	w.Write([]byte("{\"ok\":true}"))
	//	vars := mux.Vars(r)
	//	send { to: f1, from: f0 }
}

func getFellowship(user string, w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	vars := mux.Vars(r)
	last := r.Form["last"][0]
	lastInt, _ := strconv.ParseInt(last, 10, 64)
	members := FELLOWSHIP.Get(vars["id"], user, lastInt)
	json, _ := json.Marshal(members)
	w.Write(json)

	// who got here before me
	// any messages for me?

	//      member = { id, last_seen, first_seen }
	//      gc if not seen in a while
	//      show me since X

	//	add user to the room w/ timestamp
	//      get others in the room since timestamp
	//	if (users)
	//		write(users)
	// 	else
	//		<- wait for new users
	//		<- wait for new messages
	//		write(new_users)
}

func getDocument(user string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fmt.Printf("Get Document\n")
	var document = Document{}
	DB.First(&document, vars["id"])
	DB.Model(&document).Related(&document.Notebook)
	DB.Model(&document).Related(&document.DataFile)
	json, _ := json.Marshal(document)
	//	fmt.Printf("json=%v\n", string(json))
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Write(json)
}

func base64Decode(s string) ([]byte, error) {
	// add back missing padding
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}

func auth(f func(user string, w http.ResponseWriter, r *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := SESSION.Get(r, "sessionName")
		fmt.Printf("SESSION: %v\n", session)
		if session.Values["ID"] == nil {
			session.Values["ID"] = randomString(16)
			session.Save(r, w)
		}
		id := session.Values["ID"].(string)
		f(id, w, r)
	}
}

func getIndex(user string, w http.ResponseWriter, r *http.Request) {
	if r.URL.String() == "/d/deps.js" {
		w.Write([]byte(""))
	} else {
		fmt.Printf("Get Index %s\n", r.URL.String())
		var data, _ = ioutil.ReadFile("./public/index.html")
		w.Write(data)
	}
}

func main() {
	DB = connectToDatabase()
	DB.Debug()
	addr := "127.0.0.1:8888"

	FELLOWSHIP.Init()

	http.NewServeMux()

	mux := mux.NewRouter()
	mux.HandleFunc("/d/", newDocument).Methods("POST")
	mux.HandleFunc("/d/{id}.rtc", auth(getFellowship)).Methods("GET")
	mux.HandleFunc("/d/{id}.rtc", auth(putFellowship)).Methods("PUT")
	mux.HandleFunc("/d/{id}.json", auth(getDocument)).Methods("GET")
	mux.HandleFunc("/d/{id}.json", auth(updateDocument)).Methods("PUT")
	mux.HandleFunc("/d/{id}", auth(getIndex)).Methods("GET")
	mux.PathPrefix("/").Handler(noStore(http.FileServer(http.Dir("./public/"))))
	http.Handle("/", mux)

	fmt.Printf("Running on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, context.ClearHandler(http.DefaultServeMux)))

}
