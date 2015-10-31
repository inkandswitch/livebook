var $ = require('jquery')
var Peers
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

function notice(desc) {
  return function(event) { console.log("notice:" + desc,event) }
}

function newPeer(name) {
  var peer = {id: name, state: "new" }

  peer.status = function() {
    switch (peer.webrtc.iceConnectionState) {
      case 'disconnected':
        return 'departing';
      case 'new':
        return 'arriving';
      case 'connected':
      case 'completed':
        return 'here';
      default:
        console.log("ICE STATE: " + peer.webrtc.iceConnectionState)
        return 'arriving';
    }
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
      if (webrtc.iceConnectionState == 'disconnected') {
//        peer.state = "closed"
        delete Connected[name]
        if (Depart) { Depart(name) }
      }
      if (webrtc.iceConnectionState == 'connected' || webrtc.iceConnectionState == 'completed') {
        Connected[name] = peer
        if (Arrival) { Arrival(name) }
      }
    }
    webrtc.onconnecting   = notice("onconnecting")
    webrtc.onopen         = notice("onopen")
    webrtc.onaddstream    = notice("onaddstream")
    webrtc.onremovestream = notice("onremovestream")
    webrtc.ondatachannel  = function(event) {
      console.log("new data channel") // receiver sees this!
      peer.state = "ready"
      peer.data = event.channel
      peer.data.onmessage = msg => process_message(webrtc,JSON.parse(msg.data))
//      if (Arrival) Arrival(peer)
    }
    peer.webrtc = webrtc
  }

  peer.setupPeer()

  peer.send = function(obj) {
    console.log("SEND:",obj,"to",peer.data)
    try {
      peer.data.send(JSON.stringify(obj))
    } catch(e) {
      console.log("error sending message",e)
    }
  }

  peer.process = function(signals) {
    signals.forEach(function(signalJSON) {
      var signal = JSON.parse(signalJSON)
      console.log("processing signal",signal)
      var callback = function() { };
      if (signal.type == "offer") callback = function() {
        peer.state = "answering"
        peer.webrtc.createAnswer(function(answer) {
          console.log("created answer",answer)
          peer.state = "answering-setlocal"
          peer.webrtc.setLocalDescription(answer,function() {
            console.log("set local descr")
            put(peer.id,answer)
          },function(e) {
            console.log("Error setting setLocalDescription",e)
          })
        }, function(e) {
          console.log("Error creating answer",e)
        });
      }
      if (signal.sdp) {
        peer.state = "setremote"
        peer.webrtc.setRemoteDescription(new RTCSessionDescription(signal), callback, function(e) {
          console.log("Error setRemoteDescription",e)
        })
      } else if (signal.candidate) {
        peer.webrtc.addIceCandidate(new RTCIceCandidate(signal));
      }
    })
  }

/*
  peer.get = function() {
    $.ajax(URL, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
        peer.process(data)
        peer.get()
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
  }
*/

  peer.offer = function() {
    peer.data           = peer.webrtc.createDataChannel("datachannel",{reliable: false});
    peer.data.onmessage = notice("data:message")
    peer.data.onclose   = notice("data:onclose")
    peer.data.onerror   = notice("data:error")
    peer.data.onopen    = function(event) {
      console.log("data channel open")
      peer.state = "ready"
      if (Arrival) Arrival(peer)
    }
    peer.state = "offering"
    peer.webrtc.createOffer(desc => {
      peer.state = "offer-setlocal"
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
    $.ajax(URL + "?session_id=" + SessionID, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
//        console.log("GOT",data)
        SessionID = data.SessionID
        if (Peers == undefined) {
          Peers = {}
          data.Members.forEach((member) => {
            Peers[member] = newPeer(member)
            Peers[member].offer()
          })
        } else {
          data.Members.forEach((member) => {
            Peers[member] = newPeer(member)
          })
        }
        for (let from in data.Messages) {
          Peers[from].process(data.Messages[from])
        }
        setTimeout(get,500)
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
}

module.exports.peers = function() {
  var peers = [ {name:"Me", status: "here" }]
  Object.keys(Peers).forEach((key) => {
    peers.push({name:key, status:Peers[key].status() })
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

module.exports.hello = "World"
