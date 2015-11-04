var marked = require("marked")

module.exports = {
  asyncRunParallel: asyncRunParallel,
  deepClone       : deepClone,
  noop            : () => {},
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
  if (result.head && result.body) {
  var table = "<table><thead><tr><th>&nbsp;</th>";
  result.head.forEach(h => table += "<th>" + h + "</th>")
  table += "</tr></thead>"
  table += "<tbody>"
  result.head.forEach(h => {
    table += "<tr><th>" + h + "</th>"
    result.body[h].forEach(d => table += "<td>" + d + "</td>")
    table += "</tr>"
  })
  table += "</tbody>"
  table += "</table>";

  return table;
  } else { // TODO - legacy
  var table = "<table><thead><tr><th>&nbsp;</th>";
  result.cols.forEach(col => table += "<th>" + col + "</th>")
  table += "</tr></thead>"
  table += "<tbody>"
  result.rows.forEach(row => {
    table += "<tr><th>" + row + "</th>"
    result.cols.forEach(col => {
      var cellContent = result.data[row][col];
      if (cellContent.toFixed) {
        cellContent = cellContent.toFixed(6);
      }
      table += "<td>" + cellContent + "</td>";
    })
    table += "</tr>"
  })
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

function zip(a, b) {
  return a.map((v, i) => [v, b[i]]);
}
