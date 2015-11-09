var $ = require('jquery')
var Peers = {}
var Connected = {}
var URL
var WebRTCServers = null
var SessionID = ""
var Arrival
var Depart

var vals = (obj) => Object.keys(obj).map((k) => obj[k])

// peer list (server [live:dead], webrtc [live:dead] )
// peer.live = () => server.live() || webrtc.live()

// 1a ----> who is here? (excluding A,B,C)
// 1b <---- here is a list of peers [1,2,3]
// 2a ----> offer1, offer2, offer3
// 2b <---- reply1, reply2, reply3
// 3c ----> please alert me to any new offers! (exits? arrivals?) (long poll? / websocket?)

var now = () => Math.round(Date.now() / 1000)
var age = (t) => now() - t

function notice(desc) {
  return function(event) { console.log("notice:" + desc,event) }
}

function newPeer(session_id) {
  var peer = {id: session_id, state: "new"}

  peer.set_session = function(s) {
    peer.session_record = s
    peer.update_state()
  }

  peer.setupPeer = function() {
    var webrtc = new RTCPeerConnection(WebRTCServers)

    webrtc.onicecandidate = function(event) {
      if (event.candidate) {
        put(peer.id, event.candidate) // FIXME
      }
    }

    webrtc.oniceconnectionstatechange = function(event) {
      console.log("notice:statechange",webrtc.iceConnectionState, event)
      peer.update_state()
    }

    webrtc.onconnecting   = notice("onconnecting")
    webrtc.onopen         = notice("onopen")
    webrtc.onaddstream    = notice("onaddstream")
    webrtc.onremovestream = notice("onremovestream")
    webrtc.ondatachannel  = function(event) {
      console.log("new data channel") // receiver sees this!
      peer.data_channel = event.channel
      peer.data_channel.onmessage = msg => process_message(webrtc,JSON.parse(msg.data))
      peer.update_state()
    }
    peer.webrtc = webrtc
  }

  peer.update_state = function() {
    var old_state = peer.state
    var new_state = peer.calculate_state()
    if (old_state != new_state) {
      peer.state = new_state
      switch (peer.state) {
        case "connected":
          if (Arrival) Arrival(peer)
          break
        case "disconnected":
          if (Depart) { Depart(peer) }
          break
        case "closed":
          if (Depart) { Depart(peer) } // FIXME - doesnt this need its own event type?
          delete Peers[peer.id]
        default:
      }
    } else {
    }
  }

  peer.calculate_state = function() {
    if (peer.data_channel) {
      return "connected"       // data-connected
    }

    switch (peer.webrtc.iceConnectionState) {
      case 'new':
      case 'checking':
      case 'disconnected':
      case 'failed':
        break                  // return 'arriving';
      case 'connected':
      case 'completed':
        return 'connected'     // webrtc-connected
      default:
        console.log("ICE STATE UNKNOWN: " + peer.webrtc.iceConnectionState)
    }

    if (peer.session_record.active || age(peer.session_record.updated_on) < 5) {
        return 'connected'     // server-connected
    } else if (!peer.session_record.active && age(peer.session_record.updated_on) < 10) {
        return 'disconnected'  // disconnected
    } else {
        return 'closed'
    }
  }

  peer.setupPeer()

  peer.send = function(obj) {
    try {
      peer.data_channel.send(JSON.stringify(obj))
    } catch(e) {
    }
  }

  peer.process = function(signals) {
    signals.forEach(function(signalJSON) {
      var signal = JSON.parse(signalJSON)
      var callback = function() { };
      if (signal.type == "offer") callback = function() {
        peer.state = "answering"
        peer.webrtc.createAnswer(function(answer) {
          peer.state = "answering-setlocal"
          peer.webrtc.setLocalDescription(answer,function() {
            put(peer.id,answer)
          },function(e) {
            console.log("Error setting setLocalDescription",e)
          })
        }, function(e) {
          console.log("Error creating answer",e)
        });
      }
      if (signal.sdp) {
        peer.webrtc.setRemoteDescription(new RTCSessionDescription(signal), callback, function(e) {
          console.log("Error setRemoteDescription",e)
        })
      } else if (signal.candidate) {
        peer.webrtc.addIceCandidate(new RTCIceCandidate(signal));
      }
    })
  }

  peer.offer = function() {
    var data = peer.webrtc.createDataChannel("datachannel",{reliable: false});
    data.onmessage = notice("data:message")
    data.onclose   = notice("data:onclose")
    data.onerror   = notice("data:error")
    data.onopen = function(event) {
      console.log("data channel open")
      peer.data_channel = data
      peer.update_state()
    }
    peer.webrtc.createOffer(desc => {
      peer.webrtc.setLocalDescription(desc,
        () => put(peer.id,desc),
        e  => console.log("error on setLocalDescription",e))
    }, e => console.log("error with createOffer",e));
  }

  return peer
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

function get() {
    $.ajax(URL + "?session=" + SessionID, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
//        console.log("GOT",data)
        SessionID = data.session_id
        var came_before_me = true
        data.sessions.forEach((session) => {
          if (session.session_id == SessionID) came_before_me = false;
          else if (Peers[session.session_id] == undefined) {
            Peers[session.session_id] = newPeer(session.session_id)
            Peers[session.session_id].set_session(session)

            // TODO - make cleaner - Im deleting from Peers on close - can happen in set_session() for defunct connections
            if (came_before_me && Peers[session.session_id]) Peers[session.session_id].offer()
          } else {
            Peers[session.session_id].set_session(session)
          }
        })
        for (let from in data.messages) {
          if (Peers[from]) Peers[from].process(data.messages[from])
        }
        setTimeout(get,500)
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
}

module.exports.peers = function() {
  var peers = [ {name:`Me (${SessionID})`, status: "here" }]
  Object.keys(Peers).forEach((key) => {
    if (Peers[key].state == "connected") {
      peers.push({name:key, status:"here"})
    } else if (Peers[key].state == "disconnected") {
      peers.push({name:key, status:"departing"})
    } else {
    }
  })
  return peers
}
//() => Object.keys(Connected).map((key) => Connected[key])

module.exports.arrive = function(func) {
  Arrival = func
}

module.exports.depart = function(func) {
  Depart = func
}

module.exports.join = function(url) {
  URL = url
  get()
}

setInterval(function() {
  //console.log("checking (n) peers",Object.keys(Peers).length)
  for (let session_id in Peers) {
    Peers[session_id].update_state()
  }
},3000)

module.exports.hello = "World"
