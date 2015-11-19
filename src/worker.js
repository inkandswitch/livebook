
onmessage = function(e) {
  var workerResult = 'Result: ' + (e.data);
  postMessage(workerResult);
}

