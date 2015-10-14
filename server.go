package main

import (
	_ "database/sql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/jinzhu/gorm"
	"github.com/gorilla/mux"
	"github.com/gorilla/context"
	"io/ioutil"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"fmt"
	"os"
	"log"
)

type DataFile struct {
	gorm.Model
        DocumentId  uint
        Name        string `sql:"type:text"`
        Body        string `sql:"type:text"`
}

type Notebook struct {
	gorm.Model
        DocumentId  uint
        Name        string `sql:"type:text"`
        Body        string `sql:"type:text"`
}

type Document struct {
	gorm.Model
        Name        string `sql:"type:text"`
	Notebook    Notebook
	DataFile    DataFile
}

func noStore(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func connectToDatabase() (DB gorm.DB) {
	var databaseURL = os.Getenv("DATABASE_URL")
	var url,_ = url.Parse(databaseURL)
	switch url.Scheme {
		case "sqlite3":
			DB, _ = gorm.Open(url.Scheme, url.Host)
		case "postgres":
			var host = url.Host
			var port = "5432"
			var hostChunks = strings.Split(host,":")
			if (len(hostChunks) == 2) {
				host = hostChunks[0]
				port = hostChunks[1]
			}
			var username = url.User.Username()
			var password,hasPas = url.User.Password()
			var db = strings.Trim(url.Path,"/")
			var constr string
			if (hasPas) {
				constr = fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",username, password, host, port, db)
			} else {
				constr = fmt.Sprintf("user=%s host=%s port=%s dbname=%s sslmode=disable",username, host, port, db)
			}
			fmt.Printf("constr %s\n",constr)
			DB, _ = gorm.Open(url.Scheme, constr)
		default:
			fmt.Printf("unknown DATABASE_URL schema in %s\n",databaseURL)
			os.Exit(1)
	}
        DB.AutoMigrate(&Notebook{}, &DataFile{}, &Document{})
	return
}

var DB gorm.DB

func newDocument(w http.ResponseWriter, r *http.Request) {
	var document = Document{}
        body, _ := ioutil.ReadAll(r.Body)
	fmt.Printf("Post Document %v\n",body)
	json.Unmarshal(body,&document)
	DB.Debug().Create(&document)
	w.Write([]byte(fmt.Sprintf("/d/%d\n",document.ID)))
}

func getDocument(w http.ResponseWriter, r *http.Request) {
        vars := mux.Vars(r)
	fmt.Printf("Get Document\n")
	var document = Document{}
	DB.First(&document, vars["id"])
	DB.Model(&document).Related(&document.Notebook)
	DB.Model(&document).Related(&document.DataFile)
        json, _ := json.Marshal(document)
        fmt.Printf("json=%v\n",string(json))
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        w.Write(json)
}

func getIndex(w http.ResponseWriter, r *http.Request) {
	if (r.URL.String() == "/d/deps.js") {
		w.Write([]byte(""))
	} else {
		fmt.Printf("Get Index %s\n", r.URL.String())
		var data,_ = ioutil.ReadFile("./public/index.html")
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
        mux.HandleFunc("/d/{id}.json", getDocument).Methods("GET")
        mux.HandleFunc("/d/{id}", getIndex).Methods("GET")
        mux.PathPrefix("/").Handler(noStore(http.FileServer(http.Dir("./public/"))))
        http.Handle("/", mux)

        fmt.Printf("Running on %s\n", addr)
        log.Fatal(http.ListenAndServe(addr, context.ClearHandler(http.DefaultServeMux)))

}
