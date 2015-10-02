package main

import "net/http"

func noStore(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func main() {
	http.ListenAndServe(":8888", noStore(http.FileServer(http.Dir("public"))))
}
