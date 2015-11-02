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
	SessionID SessionID `json:"session_id"`
	UpdatedOn int64     `json:"updated_on"`
	CreatedOn int64     `json:"created_on"`
	Active    bool      `json:"active"`
	messages  map[SessionID][]string
	reply     *func()
}

func (s *Session) Reply() {
	if s.reply != nil {
		(*s.reply)()
		s.reply = nil
	}
}

type GroupID string
type SessionID string

type Cradle struct {
	Sessions map[GroupID][]*Session
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
	SessionID SessionID              `json:"session_id"`
	Sessions  []*Session             `json:"sessions"`
	Messages  map[SessionID][]string `json:"messages"`
}

func New() *Cradle {
	c := &Cradle{}
	c.Init()
	return c
}

func (c *Cradle) Init() {
	c.Sessions = map[GroupID][]*Session{}
	c.events = make(chan func())
	go c.handler()
}

func (c *Cradle) handler() {
	ticker := time.Tick(5 * time.Second)
	for {
		select {
		case <-ticker:
			//			c.cleanup()
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

func (c *Cradle) sessionTouch(group_id GroupID, session_id SessionID) (*Session, bool) {
	session := c.session(group_id, session_id)
	now := time.Now().Unix()
	init := false
	if session == nil {
		session_id = SessionID(randomString(6)[0:4])
		session = &Session{SessionID: session_id, CreatedOn: now, messages: map[SessionID][]string{}}
		c.Sessions[group_id] = append(c.Sessions[group_id], session)
		init = true
	}
	session.UpdatedOn = now
	return session, init
}

func (c *Cradle) session(group_id GroupID, session_id SessionID) *Session {
	if c.Sessions[group_id] == nil {
		c.Sessions[group_id] = []*Session{}
	}
	for _, session := range c.Sessions[group_id] {
		if session.SessionID == session_id {
			return session
		}
	}
	return nil
}

func (c *Cradle) sessionDo(group_id GroupID, session_id SessionID, f func(*Session)) {
	session := c.session(group_id, session_id)
	if session != nil {
		f(session)
	} else {
		fmt.Printf("missing session_id=%v\n", session_id)
	}
}

func (c *Cradle) handlePut(put put) {
	fmt.Printf("handle put %v\n", put)

	c.sessionDo(put.group_id, put.to, func(session *Session) {
		session.messages[put.from] = append(session.messages[put.from], put.message)
		session.Reply()
	})
}

func (c *Cradle) Get(group_id string, name string, session_id string, closer <-chan bool) *CradleState {
	get := get{group_id: GroupID(group_id), session_id: SessionID(session_id), closer: closer, reply: make(chan *CradleState)}
	c.events <- func() { c.handleGet(get) }
	return <-get.reply
}

func (c *Cradle) handleGet(get get) {
	fmt.Printf("handle get %v\n", get)

	session, init := c.sessionTouch(get.group_id, get.session_id)
	session.Reply()

	success := make(chan bool)

	reply := func() {
		update := &CradleState{Sessions: c.Sessions[get.group_id][:], Messages: session.messages, SessionID: session.SessionID}
		session.messages = map[SessionID][]string{}
		success <- true
		get.reply <- update
	}

	go func() {
		session.UpdatedOn = time.Now().Unix()
		session.Active = false
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

	if len(session.messages) > 0 || init {
		reply()
	} else {
		session.Active = false
		session.reply = &reply
	}
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}
