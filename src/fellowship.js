var $ = require('jquery')
var Fellows
var Connected = {}
var URL
var WebRTCServers = null
var Session = ""
var Arrival
var Depart

var vals = (obj) => Object.keys(obj).map((k) => obj[k])

// 1a ----> who is here? (excluding A,B,C)
// 1b <---- here is a list of peers [1,2,3]
// 2a ----> offer1, offer2, offer3
// 2b <---- reply1, reply2, reply3
// 3c ----> please alert me to any new offers! (exits? arrivals?) (long poll? / websocket?)

function notice(desc) {
  return function(event) { console.log("notice:" + desc,event) }
}

function mkFellow(name) {
  var fellow = {id: name, state: "new" }

  fellow.status = function() {
    switch (fellow.peer.iceConnectionState) {
      case 'disconnected':
        return 'departing';
      case 'new':
        return 'arriving';
      case 'connected':
      case 'completed':
        return 'here';
      default:
        console.log("ICE STATE: " + fellow.peer.iceConnectionState)
        return 'arriving';
    }
  }

  fellow.setupPeer = function() {
    var peer = new RTCPeerConnection(WebRTCServers)

    peer.onicecandidate = function(event) {
      if (event.candidate) {
        put(fellow.id, event.candidate) // FIXME
      }
    }
    peer.oniceconnectionstatechange = function(event) {
      console.log("notice:statechange",peer.iceConnectionState, event)
      if (peer.iceConnectionState == 'disconnected') {
//        fellow.state = "closed"
        delete Connected[name]
        if (Depart) { Depart(name) }
      }
      if (peer.iceConnectionState == 'connected' || peer.iceConnectionState == 'completed') {
        Connected[name] = fellow
        if (Arrival) { Arrival(name) }
      }
    }
    peer.onconnecting   = notice("onconnecting")
    peer.onopen         = notice("onopen")
    peer.onaddstream    = notice("onaddstream")
    peer.onremovestream = notice("onremovestream")
    peer.ondatachannel  = function(event) {
      console.log("new data channel") // receiver sees this!
      fellow.state = "ready"
      fellow.data = event.channel
      fellow.data.onmessage = msg => process_message(peer,JSON.parse(msg.data))
//      if (Arrival) Arrival(fellow)
    }
    fellow.peer = peer
  }

  fellow.setupPeer()

  fellow.send = function(obj) {
    console.log("SEND:",obj,"to",fellow.data)
    try {
      fellow.data.send(JSON.stringify(obj))
    } catch(e) {
      console.log("error sending message",e)
    }
  }

  fellow.process = function(signals) {
    signals.forEach(function(signalJSON) {
      var signal = JSON.parse(signalJSON)
      console.log("processing signal",signal)
      var callback = function() { };
      if (signal.type == "offer") callback = function() {
        fellow.state = "answering"
        fellow.peer.createAnswer(function(answer) {
          console.log("created answer",answer)
          fellow.state = "answering-setlocal"
          fellow.peer.setLocalDescription(answer,function() {
            console.log("set local descr")
            put(fellow.id,answer)
          },function(e) {
            console.log("Error setting setLocalDescription",e)
          })
        }, function(e) {
          console.log("Error creating answer",e)
        });
      }
      if (signal.sdp) {
        fellow.state = "setremote"
        fellow.peer.setRemoteDescription(new RTCSessionDescription(signal), callback, function(e) {
          console.log("Error setRemoteDescription",e)
        })
      } else if (signal.candidate) {
        fellow.peer.addIceCandidate(new RTCIceCandidate(signal));
      }
    })
  }

/*
  fellow.get = function() {
    $.ajax(URL, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
        fellow.process(data)
        fellow.get()
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
  }
*/

  fellow.offer = function() {
    fellow.data           = fellow.peer.createDataChannel("datachannel",{reliable: false});
    fellow.data.onmessage = notice("data:message")
    fellow.data.onclose   = notice("data:onclose")
    fellow.data.onerror   = notice("data:error")
    fellow.data.onopen    = function(event) {
      console.log("data channel open")
      fellow.state = "ready"
      if (Arrival) Arrival(fellow)
    }
    fellow.state = "offering"
    fellow.peer.createOffer(desc => {
      fellow.state = "offer-setlocal"
      fellow.peer.setLocalDescription(desc,
        () => put(fellow.id,desc),
        e  => console.log("error on setLocalDescription",e))
    }, e => console.log("error with createOffer",e));
  }

  return fellow
}

function put(target, message) {
  $.ajax(URL, {
    method: "put",
    dataType: "json",
    data: { to: target, session: Session, message: JSON.stringify(message) },
    success: function(data) {
    },
    error: function(e) {
      console.log("Fail to PUT",URL,e)
    }
  });
}

function get() {
    $.ajax(URL + "?session=" + Session, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
//        console.log("GOT",data)
        Session = data.Session
        if (Fellows == undefined) {
          Fellows = {}
          data.Members.forEach((member) => {
            Fellows[member] = mkFellow(member)
            Fellows[member].offer()
          })
        } else {
          data.Members.forEach((member) => {
            Fellows[member] = mkFellow(member)
          })
        }
        for (let from in data.Messages) {
          Fellows[from].process(data.Messages[from])
        }
        setTimeout(get,500)
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
}

module.exports.fellows = function() {
  var fellows = [ {name:"Me", status: "here" }]
  Object.keys(Fellows).forEach((key) => {
    fellows.push({name:key, status:Fellows[key].status() })
  })
  return fellows
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
