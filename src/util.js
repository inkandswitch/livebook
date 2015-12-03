var marked = require("marked")

var randomColor = randomColorGenerator();

module.exports = {
  asyncRunParallel: asyncRunParallel,
  deepClone       : deepClone,
  noop            : () => {},
  randomColor     : randomColor,
  rawMarkup       : rawMarkup,
  resultToHtml    : resultToHtml,
  zip             : zip,
};

function deepClone(o) {
  // Hack
  return JSON.parse(JSON.stringify(o));
}

function rawMarkup(lines) {
  return {
    __html: marked(lines.join(""), { sanitize: true, })
  };
}

function resultToHtml(result) {
  if (result.head && result.body) { // this is DataFrame
    var table = "<table><thead><tr><th>&nbsp;</th>";
    result.head.forEach(h => {
      if (h == result.sort) return;
      table += "<th>" + h + "</th>"
    })
    table += "</tr></thead>"
    table += "<tbody>"
    for (let i = 0; i < result.length; i++) {
      if (result.sort) {
        table += "<tr><th>" + result.body[result.sort][i] + "</th>"
      } else {
        table += "<tr><th>" + i + "</th>"
      }
      result.head.forEach(h => {
        if (h == result.sort) return;
        var cellContent = result.body[h][i];
        if (cellContent && cellContent.toFixed) { cellContent = cellContent.toFixed(6); }
        table += "<td>" + (cellContent||"&nbsp;") + "</td>"
      })
      table += "</tr>"
    }
    table += "</tbody>"
    table += "</table>";

    return table;
  }
}

/**
 * Runs an array of asynchronous tasks in parallel. Passes the result to callback.
 * If any function errors, we immediately invoke callback with the offending error.
 *
 * @param {array} funcs - An array of functions to be executed in parallel. Each function in this array should pass (error, result) to a callback
 * @param {function} callback - Invoked with results from each
 */
function asyncRunParallel(funcs, callback) {
  var completedFuncs = 0;
  var results = [];
  var errorEncountered = false;

  funcs.forEach((func) => {

    func((error, result) => {
      // Has the callback already been called with an error?
      if (errorEncountered) {
        return;
      }
      // Did we error?
      if (error) {
        // Invoke callback immediately
        callback(error);
        errorEncountered = true;
        return
      }
      // Huzzah! We have a result.
      results.push(result);
      completedFuncs++;

      // Is this the last function to complete?
      if (completedFuncs === funcs.length) {
        callback(null, results);
      }
    })

  });
}

function randomColorGenerator() {
  var lastIndex = 0;
  var colors = ['#9E11A8', '#FF8018', '#D6F717'];

  return function(i) {
    if (i === undefined) {
      lastIndex = (lastIndex+1) % colors.length;
      return colors[lastIndex];
    }
    return colors[i % colors.length];
  };
}


function zip(a, b) {
  return a.map((v, i) => [v, b[i]]);
}
