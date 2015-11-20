var $ = require('jquery')
var Peers = {}
var Connected = {}
var URL
var WebRTCServers = null
var SessionID = ""
var User = ""
var Depart

// TODO

// what if join is called twice?
// why do I sometimes get setlocal errors
// rejecting aged out sessions happens in two places - fix
// where do I do local ageing out?
// send message through server
// handle server reset
// live == server active || webrtc active
// works properly when server is cut - just no one new can join

var now    = () => Math.round(Date.now() / 1000)
var age    = (t) => now() - t
var notice = (peer,desc) => (event) => console.log("notice:" + peer.id + ": " + desc, event)

function create_webrtc() {
  var self = this
  var webrtc = new RTCPeerConnection(WebRTCServers)

  webrtc.onicecandidate = function(event) {
    if (event.candidate) {
      put(self.id, event.candidate) // FIXME
    }
  }

  webrtc.oniceconnectionstatechange = function(event) {
    console.log("notice:statechange",webrtc.iceConnectionState, event)
    self.update_state()
  }

  webrtc.onconnecting   = notice("onconnecting")
  webrtc.onopen         = notice("onopen")
  webrtc.onaddstream    = notice("onaddstream")
  webrtc.onremovestream = notice("onremovestream")
  webrtc.ondatachannel  = function(event) {
    console.log("new data channel") // receiver sees this!
    self.data_channel = event.channel
    self.data_channel.onmessage = msg => process_message(webrtc,JSON.parse(msg.data))
    self.update_state()
  }
  self.webrtc = webrtc
}

function calculate_state() {
  let self = this;
  if (self.data_channel) {
    return "connected"       // data-connected
  }

  switch (self.webrtc.iceConnectionState) {
    case 'new':
    case 'checking':
    case 'disconnected':
    case 'failed':
      break                  // return 'arriving';
    case 'connected':
    case 'completed':
      return 'connected'     // webrtc-connected
    default:
      console.log("ICE STATE UNKNOWN: " + self.webrtc.iceConnectionState)
  }

  if (self.session_record.active || age(self.session_record.updated_on) < 5) {
      return 'connected'     // server-connected
  } else if (!self.session_record.active && age(self.session_record.updated_on) < 10) {
      return 'disconnected'  // disconnected
  } else {
      return 'closed'
  }
}

function set_session(s) {
  let self = this;
  self.session_record = s
  self.update_state()
}

function update_state() {
  let self = this
  let old_state = self.state
  let new_state = self.calculate_state()
  if (old_state != new_state) {
    self.state = new_state
    switch (self.state) {
      case "connected":
        Exports.onarrive(self)
        break
      case "disconnected":
        Exports.ondepart(self)
        break
      case "closed":
        Exports.ondepart(self)
        delete Peers[self.id]
      default:
    }
  }
}

function send(obj) {
  let self = this
  try {
    self.data_channel.send(JSON.stringify(obj))
  } catch(e) {
    console.log("Error sending data",e)
  }
}

function process(signals) {
  let self = this
//  console.log("PROCESS",this.id,signals)
  signals.forEach(function(signalJSON) {
    var signal = JSON.parse(signalJSON)
    var callback = function() { };
    if (signal.type == "offer") callback = function() {
      self.state = "answering"
//      console.log("CREATE ANSWER",self)
      self.webrtc.createAnswer(function(answer) {
        self.state = "answering-setlocal"
        self.webrtc.setLocalDescription(answer,function() {
          put(self.id,answer)
        },function(e) {
          console.log("Error setting setLocalDescription",e)
        })
      }, function(e) {
        console.log("Error creating answer",e)
      });
    }
    if (signal.sdp) {
//      console.log("SETREMOTE",self.id)
      self.webrtc.setRemoteDescription(new RTCSessionDescription(signal), callback, function(e) {
        console.log("Error setRemoteDescription",e)
      })
    } else if (signal.candidate) {
      self.webrtc.addIceCandidate(new RTCIceCandidate(signal));
    }
  })
}

function offer() {
  let self = this;
  let data = self.webrtc.createDataChannel("datachannel",{reliable: false});
  data.onmessage = notice(self,"data:message")
  data.onclose   = notice(self,"data:onclose")
  data.onerror   = notice(self,"data:error")
  data.onopen    = function(event) {
    console.log("data channel open")
    self.data_channel = data
    self.update_state()
  }
//  console.log("OFFER",self.id)
  self.webrtc.createOffer(desc => {
//    console.log("SETLOCAL",self.id,desc)
    self.webrtc.setLocalDescription(desc,
      () => {
//          console.log("DONE SETLOCAL",self.id)
          put(self.id,desc)
      },
      e  => console.log("error on setLocalDescription",e))
  }, e => console.log("error with createOffer",e));
}

function Peer(session) {
  let self   = this

  self.id             = session.session_id
  self.state          = "new"
  self.session_record = session

  self.calculate_state = calculate_state
  self.create_webrtc   = create_webrtc
  self.update_state    = update_state
  self.set_session     = set_session

  self.process = process
  self.offer   = offer
  self.send    = send

  Peers[self.id] = self

  self.create_webrtc()
  self.update_state()
}

function process_message(webrtc, message) {
  console.log("GOT MESSAGE",message)
}

function broadcast(message) {
  for (let key in Peers) {
    let p = Peers[key]
    p.send(message)
  }
}

function put(target, message) {
  $.ajax(URL, {
    method: "put",
    dataType: "json",
    data: { to: target, session_id: SessionID, message: JSON.stringify(message) },
    success: function(data) {
    },
    error: function(e) {
      console.log("Fail to PUT",URL,e)
    }
  });
}

function process_incoming_sessions(incoming) {
  var sessions = [];

  var came_after_me = false;

  incoming.forEach((s) => {
    s.me = s.session_id == SessionID;
    s.age = now() - s.updated_on;
    s.active = s.active;
    s.offer = came_after_me;

    if (s.me) came_after_me = true;

//    console.log("SESSION",{id: s.session_id, age: s.age, me: s.me, offer: s.offer, a: s.active } );

    if (!s.me && (s.active || s.age <= 5)) sessions.push(s);
  })

  return sessions
}

function process_session_data_from_server(data) {
  SessionID = data.session_id
  User = data.user

//  console.log("ME",SessionID)

  var sessions = process_incoming_sessions(data.sessions)

  sessions.forEach((s) => {
    let peer = Peers[s.session_id]
    if (peer == undefined) {
      peer = new Peer(s)
      if (s.offer) peer.offer()
    } else {
      peer.set_session(s)
    }
  })
  for (let from in data.messages) {
    if (Peers[from]) Peers[from].process(data.messages[from])
  }
}


function get() {
    $.ajax(URL + "?session=" + SessionID, {
      contentType: "application/json; charset=UTF-8",
      method:      "get",
      dataType:    "json",
      success:     process_session_data_from_server,
      error:       (e) => console.log("Fail to get",URL,e),
      complete:    () => setTimeout(get,500)
    });
}

function peers() {
  var peers = [ { session: SessionID, user: User, status: "here" }]
  Object.keys(Peers).forEach((key) => {
    let p = Peers[key]
    if (p.state == "connected") {
      peers.push({session:key, user: p.user,  status:"here"})
    } else if (p.state == "disconnected") {
      peers.push({session:key, user: p.user, status:"departing"})
    } else {
    }
  })
  return peers
}

function update_peers() {
  for (var k in Peers)
    Peers[k].update_state()
}


function join(url) {
  Peers = {}
  Connected = {}
  WebRTCServers = null
  SessionID = ""
  URL = url
  get()
}

setInterval(update_peers,3000) // this is basically a no-op when not connected

var Exports = {
  join:       join,
  peers:      peers,
  broadcast:  broadcast,
  onarrive: () => {},
  ondepart: () => {},
}

module.exports = Exports
