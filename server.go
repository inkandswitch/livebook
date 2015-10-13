package main

import (
	_ "database/sql"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/jinzhu/gorm"
	"net/http"
	"net/url"
	"strings"
	"fmt"
	"os"
)

type File struct {
	gorm.Model
        DocumentId  uint
        Name        string `sql:"type:text"`
        Body        string `sql:"type:text"`
}

type Document struct {
	gorm.Model
        Name        string `sql:"type:text"`
	Notebook    File
	Data        File
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
        DB.AutoMigrate(&File{}, &Document{})
	return
}

func main() {
	var DB = connectToDatabase()
	DB.Debug()
	http.ListenAndServe(":8888", noStore(http.FileServer(http.Dir("public"))))
}
