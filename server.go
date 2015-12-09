package main

// user may have multiple sessions [split screen]
// messages are sent to a session not a user
// agressivly time sessions out - potentially bring them back if needed

// TODO

import (
	"crypto/rand"
	_ "database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/aordlab/livebook/cradle"
	"github.com/gorilla/context"
	"github.com/gorilla/handlers"
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

var CRADLE = cradle.New()

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
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
	json.Unmarshal(body, &document)
	DB.Create(&document)
	w.Write([]byte(fmt.Sprintf("/d/%d\n", document.ID)))
}

func updateDocument(user_id string, w http.ResponseWriter, r *http.Request) {
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

func postMessageCradle(user_id string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	r.ParseForm()
	to := r.Form["to"][0]
	session_id := r.Form["session_id"][0] // SECURITY ISSUE - CAN FORGE MESSAGES - FIXME
	message := r.Form["message"][0]
	CRADLE.Post(vars["id"], session_id, to, message)
	w.Write([]byte("{\"ok\":true}"))
}

func putConfigCradle(user_id string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	r.ParseForm()
	fmt.Printf("Got a PUT action %v\n", r.Form)
	if r.Form["user"] != nil {
		userState := r.Form["user"][0]
		session, _ := SESSION.Get(r, "sessionName")
		session.Values["state"] = userState
		session.Save(r, w)
		CRADLE.UpdateUser(vars["id"], user_id, userState)
	}
	if r.Form["state"] != nil {
		fmt.Printf("UpdateState %v\n", r.Form["state"])
		session_id := r.Form["session_id"][0] // SECURITY ISSUE - CAN FORGE MESSAGES - FIXME
		sessionState := r.Form["state"][0]
		CRADLE.UpdateState(vars["id"], session_id, sessionState)
	}
	w.Write([]byte("{\"ok\":true}"))
}

func getCradle(user_id string, w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	vars := mux.Vars(r)
	session_id := r.Form["session"][0]
	fmt.Printf("GET INPUT session=%v\n", session_id)
	session, _ := SESSION.Get(r, "sessionName")
	oldUserState := "{}"
	if session.Values["state"] != nil {
		oldUserState = session.Values["state"].(string)
	}
	sessions := CRADLE.Get(vars["id"], user_id, oldUserState, session_id, w.(http.CloseNotifier).CloseNotify())
	fmt.Printf("GET OUTPUT session=%v %v\n", session_id, sessions)
	if sessions != nil {
		json, _ := json.Marshal(sessions)
		w.Write(json)
	}
}

func getDocument(user_id string, w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var document = Document{}
	DB.First(&document, vars["id"])
	DB.Model(&document).Related(&document.Notebook)
	DB.Model(&document).Related(&document.DataFile)
	json, _ := json.Marshal(document)
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

func auth(f func(user_id string, w http.ResponseWriter, r *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := SESSION.Get(r, "sessionName")
		if session.Values["ID"] == nil {
			session.Values["ID"] = randomString(8)
			session.Values["state"] = "{}"
			session.Save(r, w)
		}
		id := session.Values["ID"].(string)
		f(id, w, r)
	}
}

func getIndex(user_id string, w http.ResponseWriter, r *http.Request) {
	if r.URL.String() == "/d/deps.js" {
		w.Write([]byte(""))
	} else {
		var data, _ = ioutil.ReadFile("./public/index.html")
		w.Write(data)
	}
}

func noStore(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func main() {
	DB = connectToDatabase()
	DB.Debug()
	port := os.Getenv("PORT")
	addr := ":" + port
	fmt.Printf("port=%v\n", port)

	http.NewServeMux()

	compress := handlers.CompressHandler

	mux := mux.NewRouter()
	mux.HandleFunc("/d/", newDocument).Methods("POST")
	mux.HandleFunc("/d/{id}.rtc", auth(getCradle)).Methods("GET")
	mux.HandleFunc("/d/{id}.rtc", auth(postMessageCradle)).Methods("POST")
	mux.HandleFunc("/d/{id}.rtc", auth(putConfigCradle)).Methods("PUT")
	mux.HandleFunc("/d/{id}.json", auth(getDocument)).Methods("GET")
	mux.HandleFunc("/d/{id}.json", auth(updateDocument)).Methods("PUT")
	mux.HandleFunc("/d/{id}", auth(getIndex)).Methods("GET")
	mux.HandleFunc("/upload", auth(getIndex)).Methods("GET")
	mux.HandleFunc("/upload/", auth(getIndex)).Methods("GET")
	mux.PathPrefix("/").Handler(noStore(compress(http.FileServer(http.Dir("./public/")))))

	http.Handle("/", mux)

	fmt.Printf("Running on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, context.ClearHandler(http.DefaultServeMux)))

}
