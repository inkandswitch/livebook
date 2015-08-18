var express = require('express')
var app = express()
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use('/', express.static('public'));
app.use('/bower_components/', express.static('bower_components'));

var data = {};
var poll = {}

app.put('/call/:id',function(req,res) {
  var id = req.params.id
  console.log("PUT::"+id+"::"+JSON.stringify(req.body))
  if (poll[id]) {
//    console.log("someone's waiting for us - send them the data")
    var response = req.body
    console.log("GETl::"+id+"::"+JSON.stringify(response))
    poll[id].json(response)
    delete poll[id]
  } else {
//    console.log("putting data body for later pickup - " + JSON.stringify(id))
//    console.log(req.body)
    if (!data[id]) data[id] = []
    data[id].push(req.body)
    console.log("data now has " + data[id].length + " elements")
  }
  res.send("ok")
});

app.get('/call/:id',function(req,res) {
  var id = req.params.id
  if (data[id]) {
//    console.log("data waiting for us - writing data")
    var response = data[id].shift()
    console.log("data has " + data[id].length + " elements")
    console.log("GETi::"+id+"::"+JSON.stringify(response))
    res.json(response)
    if (data[id].length == 0) { 
      console.log("deleting empty element at "+ id)
      delete data[id]
    }
  } else {
    console.log("::" + id + ":: no data - long-polling")
    poll[id] = res
  }
});

var server = app.listen(8888, function() {
  var host = server.address().address
  var port = server.address().port

  console.log("WRTC-test app running on " + host + ":" + port)
})
