package cradle

// user may have multiple sessions [split screen]
// messages are sent to a session not a user
// agressivly time sessions out - potentially bring them back if needed

// TODO


// things to tell people in the room
// [ ] someone new is here
// [ ] someone disconnected and did not re-connect within X
// [ ] someone who had been disconnected for a while is back

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"
)

type Session struct {
	SessionID SessionID `json:"session_id"`
	User      string    `json:"user"`
	UpdatedOn int64     `json:"updated_on"`
	CreatedOn int64     `json:"created_on"`
	Active    bool      `json:"active"`
	updated_tick     int64
	created_tick     int64
	synced_tick      int64
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
	tick     int64
	events   chan func()
}

type get struct {
	group_id   GroupID
	session_id SessionID
	user       string
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
	User      string                 `json:"user"`
	Updates   []*Session             `json:"updates"`
	Arrivals  []*Session             `json:"arrivals"`
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
	ticker := time.Tick(1 * time.Second)
	for {
		c.tick += 1
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
	for group_id, sessions := range c.Sessions {
		count := 0
		timeout := time.Now().Unix() - 5 // 5 second timeout
		for _, s := range sessions {
			if (s.Active && s.reply == nil && s.UpdatedOn < timeout) {
				s.Active = false
				s.UpdatedOn = time.Now().Unix()
				s.updated_tick = c.tick
				count++
				fmt.Printf("session %s has gone offline\n",s.SessionID)
			}
		}
		if (count > 0) {
			c.update(group_id)
		}
	}
}

func (c *Cradle) sessionTouch(group_id GroupID, session_id SessionID, user string) (*Session) {
	session := c.session(group_id, session_id)
	now := time.Now().Unix()
	if session == nil {
		session_id = SessionID(randomString(6)[0:4])
		session = &Session{SessionID: session_id, User: user, CreatedOn: now, messages: map[SessionID][]string{}}
		session.created_tick = c.tick
		session.updated_tick = c.tick
		c.Sessions[group_id] = append(c.Sessions[group_id], session)
	} else if session.User != user {
		session.User = user
		session.updated_tick = c.tick
	}
	session.Active = true
	session.UpdatedOn = now
	return session
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

func (c *Cradle) update(group_id GroupID) {
	for _, session := range c.Sessions[group_id] {
		session.Reply()
	}
}

func (c *Cradle) handlePut(put put) {
	c.sessionDo(put.group_id, put.to, func(session *Session) {
		session.messages[put.from] = append(session.messages[put.from], put.message)
		session.Reply()
	})
}

func (c *Cradle) Get(group_id string, name string, session_id string, closer <-chan bool) *CradleState {
	get := get{group_id: GroupID(group_id), user: name, session_id: SessionID(session_id), closer: closer, reply: make(chan *CradleState)}
	c.events <- func() { c.handleGet(get) }
	return <-get.reply
}

/*
func debug3(s *Session, name string) {
	fmt.Printf("%s=%s cr=%d up=%d sy=%d\n",name,s.SessionID,s.created_tick,s.updated_tick,s.synced_tick)
}
*/

func sessionActivity(sessions []*Session, observer *Session) ([]*Session,[]*Session) {
	updates := make([]*Session,0,len(sessions))
	arrivals := make([]*Session,0,len(sessions))
	for _, s := range sessions {
		if s.SessionID == observer.SessionID {
			continue
		} else if observer.created_tick < s.created_tick && observer.synced_tick < s.created_tick {
			arrivals = append(arrivals,s)
		} else if observer.synced_tick < s.updated_tick {
			updates = append(updates,s)
		} else {
			fmt.Printf("Session %s is neither an arrival or an update\n",s.SessionID)
		}
	}
	return updates,arrivals
}

func debug2(s1 []*Session) []SessionID {
	q := []SessionID{}
	for _, v := range s1 {
		q = append(q,v.SessionID)
	}
	return q
}

func debug(s1,s2 []*Session,active bool) []SessionID {
	q := []SessionID{}
	fmt.Printf("debug s1=%v s2=%v\n",debug2(s1),debug2(s2))
	for _, v := range s1 {
		if (v.Active == active) {
			q = append(q,v.SessionID)
		}
	}
	for _, v := range s2 {
		if (v.Active == active) {
			q = append(q,v.SessionID)
		}
	}
	return q
}

func (c *Cradle) handleGet(get get) {
	session := c.sessionTouch(get.group_id, get.session_id, get.user)
	session.Reply()

	success := make(chan bool)

	reply := func() {
		updates,arrivals := sessionActivity(c.Sessions[get.group_id],session)
		fmt.Printf("id='%s' a=%v active=%v mia=%v\n",session.SessionID, session.Active, debug(updates,arrivals,true), debug(updates,arrivals,false))
		update := &CradleState{Updates: updates, Arrivals: arrivals, User: get.user, Messages: session.messages, SessionID: session.SessionID}
		session.messages = map[SessionID][]string{}
		session.UpdatedOn = time.Now().Unix()
		session.synced_tick = c.tick
		success <- true
		get.reply <- update
	}

	go func() {
		select {
		case <-get.closer:
			c.events <- func() {
				fmt.Printf("Connection closed!\n")
				if session.reply == &reply {
					session.UpdatedOn = time.Now().Unix()
					session.reply = nil
				}
				get.reply <- nil
			}
		case <-success:
		}
	}()

	if session.updated_tick == c.tick {
		reply()
		c.update(get.group_id)
	} else if len(session.messages) > 0 {
		reply()
	} else {
		session.reply = &reply
	}
}

func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}
