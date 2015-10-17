var $ = require('jquery')
var Fellows
var URL
var WebRTCServers = null
var Last = 0

// 1a ----> who is here? (excluding A,B,C)
// 1b <---- here is a list of peers [1,2,3]
// 2a ----> offer1, offer2, offer3
// 2b <---- reply1, reply2, reply3
// 3c ----> please alert me to any new offers! (exits? arrivals?) (long poll? / websocket?)

function notice(desc) {
  return function(event) { console.log("notice:" + desc,event) }
}

function mkFellow(name) {
  var fellow = {id: name}

  fellow.setupPeer = function() {
    var peer = new RTCPeerConnection(WebRTCServers)

    peer.onicecandidate = function(event) {
      if (event.candidate) {
        put(fellow.id, event.candidate) // FIXME
      }
    }
    peer.onconnecting   = notice("onconnecting")
    peer.onopen         = notice("onopen")
    peer.onaddstream    = notice("onaddstream")
    peer.onremovestream = notice("onremovestream")
    peer.ondatachannel  = function(event) {
      console.log("new data channel") // receiver sees this!
      fellow.data = event.channel
      fellow.data.onmessage = msg => process_message(peer,JSON.parse(msg.data))
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
        fellow.peer.createAnswer(function(answer) {
          console.log("created answer",answer)
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
    fellow.data.onopen    = notice("data:open") // offerer sees this
    fellow.data.onclose   = notice("data:onclose")
    fellow.data.onerror   = notice("data:error")
    fellow.peer.createOffer(desc =>
      fellow.peer.setLocalDescription(desc,
        () => put(fellow.id,desc),
        e  => console.log("error on setLocalDescription",e)),
    e => console.log("error with createOffer",e));
  }

  return fellow
}

function put(target, message) {
  console.log("PUT", target, message)
  $.ajax(URL, {
    method: "put",
    dataType: "json",
    data: { to: target, message: JSON.stringify(message) },
    success: function(data) {
      console.log("PUT",data)
    },
    error: function(e) {
      console.log("Fail to PUT",URL,e)
    }
  });
}

function get() {
    $.ajax(URL + "?last=" + Last, {
      contentType: "application/json; charset=UTF-8",
      method: "get",
      dataType: "json",
      success: function(data) {
        console.log("GOT",data)
        Last = data.Timestamp
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
        setTimeout(get,5000)
      },
      error: function(e) {
        console.log("Fail to get",URL,e)
      }
    });
}

module.exports.join = function(url) {
  URL = url
  get()
}

module.exports.hello = "World"
