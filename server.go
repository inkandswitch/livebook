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
	"github.com/aordlab/livebook/Godeps/_workspace/src/github.com/gorilla/context"
	"github.com/aordlab/livebook/Godeps/_workspace/src/github.com/gorilla/mux"
	"github.com/aordlab/livebook/Godeps/_workspace/src/github.com/gorilla/sessions"
	"github.com/aordlab/livebook/Godeps/_workspace/src/github.com/jinzhu/gorm"
	_ "github.com/aordlab/livebook/Godeps/_workspace/src/github.com/lib/pq"
	_ "github.com/aordlab/livebook/Godeps/_workspace/src/github.com/mattn/go-sqlite3"
	"github.com/aordlab/livebook/cradle"
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
	r.ParseForm()
	to := r.Form["to"][0]
	session_id := r.Form["session_id"][0]
	message := r.Form["message"][0]
	CRADLE.Put(vars["id"], session_id, to, message)
	w.Write([]byte("{\"ok\":true}"))
}

func getFellowship(user string, w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	vars := mux.Vars(r)
	session_id := r.Form["session"][0]
	sessions := CRADLE.Get(vars["id"], user, session_id, w.(http.CloseNotifier).CloseNotify())
	if sessions != nil {
		json, _ := json.Marshal(sessions)
		w.Write(json)
	}
}

func getDocument(user string, w http.ResponseWriter, r *http.Request) {
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

func auth(f func(user string, w http.ResponseWriter, r *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := SESSION.Get(r, "sessionName")
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
		var data, _ = ioutil.ReadFile("./public/index.html")
		w.Write(data)
	}
}

func main() {
	DB = connectToDatabase()
	DB.Debug()
	addr := "127.0.0.1:8888"

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
