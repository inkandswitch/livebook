package cradle

// user may have multiple sessions [split screen]
// messages are sent to a session not a user
// agressivly time sessions out - potentially bring them back if needed

// TODO

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"
)

type Member struct {
	name       string
	updated_on int64
	created_on int64
	active     bool
	messages   map[SessionID][]string
	reply      *func()
}

func (m *Member) Reply() {
	if m.reply != nil {
		(*m.reply)()
		m.reply = nil
	}
}

type Group string
type SessionID string

type Fellowship struct {
	Members map[Group]map[SessionID]*Member
	putChan chan put
	getChan chan get
	events  chan func()
}

type get struct {
	group      Group
	session_id SessionID
	name       string
	closer     <-chan bool
	reply      chan *FellowshipUpdate
}

type put struct {
	group   Group
	from    SessionID
	to      SessionID
	message string
}

type FellowshipUpdate struct {
	SessionID SessionID
	Members   []SessionID
	Messages  map[SessionID][]string
}

func New() *Fellowship {
	f := &Fellowship{}
	f.Init()
	return f
}

func (f *Fellowship) Init() {
	f.Members = map[Group]map[SessionID]*Member{}
	f.getChan = make(chan get)
	f.putChan = make(chan put)
	f.events = make(chan func())
	go f.handler()
}

func (f *Fellowship) handler() {
	ticker := time.Tick(5 * time.Second)
	for {
		select {
		case <-ticker:
			f.cleanup()
		case event := <-f.events:
			event()
		case get := <-f.getChan:
			f.handleGet(get)
		case put := <-f.putChan:
			f.handlePut(put)
		}
	}
}

func (f *Fellowship) Put(group string, from string, to string, message string) {
	p := put{group: Group(group), from: SessionID(from), to: SessionID(to), message: message}
	f.events <- func() { f.handlePut(p) }
}

func (f *Fellowship) cleanup() {
	for _, v := range f.Members {
		for _, member := range v {
			member.Reply()
		}
	}
}

func (f *Fellowship) handlePut(put put) {
	fmt.Printf("handle put %v\n", put)

	//From,fok := f.Members[group][from]
	To, tok := f.Members[put.group][put.to]

	// TODO also check for the dead flag

	if !tok {
		fmt.Printf("Session mismatch - must be an out of date message u=%s s=%s\n", put.from, put.to)
		return
	}

	To.messages[put.from] = append(To.messages[put.from], put.message)

	if To.reply != nil {
		(*To.reply)()
		To.reply = nil
	}
}

func (f *Fellowship) Get(group string, name string, session_id string, closer <-chan bool) *FellowshipUpdate {
	get := get{group: Group(group), name: name, session_id: SessionID(session_id), closer: closer, reply: make(chan *FellowshipUpdate)}
	f.events <- func() { f.handleGet(get) }
	return <-get.reply
}

func (f *Fellowship) handleGet(get get) {
	fmt.Printf("handle get %v\n", get)
	group := get.group
	name := get.name
	session_id := get.session_id

	var last int64 = 0

	if f.Members[group] == nil {
		f.Members[group] = map[SessionID]*Member{}
	}

	if session_id == "" || f.Members[group][session_id] == nil { // begin a new session
		session_id = SessionID(randomString(6))
		f.Members[group][session_id] = &Member{name: name, created_on: time.Now().Unix(), messages: map[SessionID][]string{}}
	} else {
		last = f.Members[group][session_id].updated_on
	}

	member := f.Members[group][session_id]

	member.Reply()

	success := make(chan bool)

	reply := func() {
		update := &FellowshipUpdate{Members: []SessionID{}, Messages: member.messages, SessionID: session_id}
		member.messages = map[SessionID][]string{}

		for k := range f.Members[group] {
			if k != session_id && f.Members[group][k].created_on >= last {
				update.Members = append(update.Members, k)
			}
		}

		success <- true
		get.reply <- update
	}

	go func() {
		member.updated_on = time.Now().Unix()
		member.active = false
		select {
		case <-get.closer:
			f.events <- func() {
				fmt.Printf("Connection closed!\n")
				if member.reply == &reply {
					member.reply = nil
				}
				get.reply <- nil
			}
		case <-success:
		}
	}()

	if len(member.messages) > 0 || get.session_id == "" {
		reply()
	} else {
		member.active = false
		member.reply = &reply
	}
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}
