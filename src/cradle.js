var $ = require('jquery')
var Peers = {}
var URL
var WebRTCServers = null
var SessionID = ""
var User = ""
var Depart
var ServerError
var ServerErrorHandler

// When we cant reach the server - the following are set :
//   ServerError = Date.now() + TIMEOUT
//   ServerErrorHandler = setInterval(update,TIMEOUT)
// These are reset on connection start
// This way we know not to trust state=active coming from the server if we cant get webrtc working

// TODO

// what if join is called twice?
// why do I sometimes get setlocal errors
// rejecting aged out sessions happens in two places - fix
// where do I do local ageing out?
// send message through server
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
    console.log("notice:statechange",self.id,webrtc.iceConnectionState, event)
    self.update_state()
  }

  webrtc.onconnecting   = notice(self,"onconnecting")
  webrtc.onopen         = notice(self,"onopen")
  webrtc.onaddstream    = notice(self,"onaddstream")
  webrtc.onremovestream = notice(self,"onremovestream")
  webrtc.ondatachannel  = function(event) {
    console.log("new data channel") // receiver sees this!
    self.data_channel = event.channel
    self.data_channel.onmessage = msg => process_message(webrtc,JSON.parse(msg.data))
    self.update_state()
  }
  self.webrtc = webrtc
}

function set_session(s) {
  let self = this;
  self.session_record = s
  self.update_state()
}

function is_webrtc_connected() {
  let self = this;

  switch (self.webrtc.iceConnectionState) {
    case 'new':
    case 'checking':
    case 'disconnected':
    case 'failed':
      return false
    case 'connected':
    case 'completed':
      return true
    default:
      console.log("ICE STATE UNKNOWN: " + self.webrtc.iceConnectionState)
      return false
  }
}


function server_responding() {
  return ServerError === undefined || ServerError > Date.now()
}

function is_server_connected() {
  let self = this
  return server_responding() && self.session_record.active
}

function is_connected() {
  let self = this
  console.log("checking ",self.id, " last=", self.last_connected, " web=", self.is_webrtc_connected(), " serv=", self.is_server_connected())
  return self.is_webrtc_connected() || self.is_server_connected()
}

function update_state() {
  let self = this
  let connected = self.is_connected()
  if (self.last_connected && !connected) {
    // disconnected
    self.last_connected = false
    Exports.onarrive(self)
  } else if (!self.last_connected && connected) {
    // connected
    self.last_connected = true
    Exports.ondepart(self)
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
  signals.forEach(function(signalJSON) {
    var signal = JSON.parse(signalJSON)
    var callback = function() { };
    if (signal.type == "offer") callback = function() {
      self.state = "answering"
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
  self.webrtc.createOffer(desc => {
    self.webrtc.setLocalDescription(desc,
      () => {
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
  self.last_connected = false

  self.is_webrtc_connected = is_webrtc_connected
  self.is_server_connected = is_server_connected
  self.is_connected        = is_connected

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

var came_after_me = false;

function evict(id) {
  var peer = Peers[id]
  delete Peers[id]
  Exports.ondepart(peer)
}

function reset_state() {
  if (Peers) {
    for (let id in Peer) {
      evict(id)
    }
  }
  Peers = {}
  SessionID = ""
  User = ""
}

function process_session_data_from_server(data) {
  if (SessionID != data.session_id) {
    reset_state()
    SessionID = data.session_id
    User = data.user
  }

  data.updates.forEach((s) => {
    let peer = Peers[s.session_id] || new Peer(s)
    peer.set_session(s)
    console.log("Update " + s.session_id + " active=" + s.active)
  })

  data.arrivals.forEach((s) => {
    console.log("Create " + s.session_id + " active=" + s.active)
    let peer = new Peer(s)
    peer.offer()
  })

  for (let from in data.messages) {
    if (Peers[from]) Peers[from].process(data.messages[from])
  }
}

function get() {
  console.log("GET()")
  $.ajax(URL + "?session=" + encodeURIComponent(SessionID), {
    contentType: "application/json; charset=UTF-8",
    method:      "get",
    dataType:    "json",
    success:     (data) => {
      process_session_data_from_server(data)
      if (ServerError) {
        console.log("Connected - clearing timer")
        ServerError = undefined
        clearTimeout(ServerErrorHandler)
      }
    },
    error:       (e) => {
      console.log("Fail to get",URL,e)
      if (!ServerError) {
        ServerError = Date.now() + 5000
        ServerErrorHandler = setTimeout(update_peers,5001)
      }
    },
    complete:    () => setTimeout(get,1000)
  });
}

function peers() {
  var peers = [ { session: SessionID, user: User, status: "here" }]
  for (let id in Peers) {
    let p = Peers[id]
    if (p.last_connected) {
      peers.push({session:id, user: p.user,  status:"here"})
    }
  }
  return peers
}

function update_peers() {
  for (var k in Peers)
    Peers[k].update_state()
}


function join(url) {
  reset_state()
  URL = url
  get()
}

var Exports = {
  join:       join,
  peers:      peers,
  broadcast:  broadcast,
  onarrive: () => {},
  ondepart: () => {},
}

module.exports = Exports
