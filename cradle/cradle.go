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

type Session struct {
	updated_on int64
	created_on int64
	active     bool
	messages   map[SessionID][]string
	reply      *func()
}

func (m *Session) Reply() {
	if m.reply != nil {
		(*m.reply)()
		m.reply = nil
	}
}

type GroupID string
type SessionID string

type Cradle struct {
	Sessions map[GroupID]map[SessionID]*Session
	events   chan func()
}

type get struct {
	group_id   GroupID
	session_id SessionID
	closer     <-chan bool
	reply      chan *CradleState
}

type put struct {
	group_id GroupID
	from     SessionID
	to       SessionID
	message  string
}

type CradleState struct {
	SessionID SessionID
	Sessions  []SessionID
	Messages  map[SessionID][]string
}

func New() *Cradle {
	c := &Cradle{}
	c.Init()
	return c
}

func (c *Cradle) Init() {
	c.Sessions = map[GroupID]map[SessionID]*Session{}
	c.events = make(chan func())
	go c.handler()
}

func (c *Cradle) handler() {
	ticker := time.Tick(5 * time.Second)
	for {
		select {
		case <-ticker:
			c.cleanup()
		case event := <-c.events:
			event()
		}
	}
}

func (c *Cradle) Put(group_id string, from string, to string, message string) {
	p := put{group_id: GroupID(group_id), from: SessionID(from), to: SessionID(to), message: message}
	c.events <- func() { c.handlePut(p) }
}

func (c *Cradle) cleanup() {
	for _, v := range c.Sessions {
		for _, session := range v {
			session.Reply()
		}
	}
}

func (c *Cradle) handlePut(put put) {
	fmt.Printf("handle put %v\n", put)

	//From,fok := c.Sessions[group_id][from]
	To, tok := c.Sessions[put.group_id][put.to]

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

func (c *Cradle) Get(group_id string, name string, session_id string, closer <-chan bool) *CradleState {
	get := get{group_id: GroupID(group_id), session_id: SessionID(session_id), closer: closer, reply: make(chan *CradleState)}
	c.events <- func() { c.handleGet(get) }
	return <-get.reply
}

func (c *Cradle) handleGet(get get) {
	fmt.Printf("handle get %v\n", get)
	group_id := get.group_id
	session_id := get.session_id

	var last int64 = 0

	if c.Sessions[group_id] == nil {
		c.Sessions[group_id] = map[SessionID]*Session{}
	}

	if session_id == "" || c.Sessions[group_id][session_id] == nil { // begin a new session
		session_id = SessionID(randomString(6))
		c.Sessions[group_id][session_id] = &Session{created_on: time.Now().Unix(), messages: map[SessionID][]string{}}
	} else {
		last = c.Sessions[group_id][session_id].updated_on
	}

	session := c.Sessions[group_id][session_id]

	session.Reply()

	success := make(chan bool)

	reply := func() {
		update := &CradleState{Sessions: []SessionID{}, Messages: session.messages, SessionID: session_id}
		session.messages = map[SessionID][]string{}

		for k := range c.Sessions[group_id] {
			if k != session_id && c.Sessions[group_id][k].created_on >= last {
				update.Sessions = append(update.Sessions, k)
			}
		}

		success <- true
		get.reply <- update
	}

	go func() {
		session.updated_on = time.Now().Unix()
		session.active = false
		select {
		case <-get.closer:
			c.events <- func() {
				fmt.Printf("Connection closed!\n")
				if session.reply == &reply {
					session.reply = nil
				}
				get.reply <- nil
			}
		case <-success:
		}
	}()

	if len(session.messages) > 0 || get.session_id == "" {
		reply()
	} else {
		session.active = false
		session.reply = &reply
	}
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}
