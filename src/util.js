var $ = require("jquery");
var marked = require("marked");
var randomColor = randomColorGenerator();

module.exports = {
  areMapsEqual,
  asyncRunParallel,
  createAsyncDataFetcher,
  deepClone,
  eventFire,
  getPixelsBeyondFold,
  isArray,
  noop: () => {},
  randomColor,
  randomName,
  rawMarkup,
  resultToHtml,
  scrollXPixels ,
  zip,
};

function areMapsEqual(m1, m2) {
  let k1 = Object.keys(m1);
  let k2 = Object.keys(m2);
  if (k1.length !== k2.length) return false;
  return k1.every( k => m1[k] === m2[k]);
}

function deepClone(o) {
  // Hack
  return JSON.parse(JSON.stringify(o));
}

function eventFire(el, etype, options){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    evObj = Object.assign(evObj, options)
    el.dispatchEvent(evObj);
  }
}

function isArray(o) {
  return Object.prototype.toString.call(o) === "[object Array]";
}

function getPixelsBeyondFold($elt) {
  let viewportHeight = window.innerHeight;
  let scrollTop = $("body").scrollTop();
  let offset = $elt.offset();
  if (!offset) return { above: 0, below: 0 };
  let topOffset = $elt.offset().top
  let bottomOffset = topOffset + $elt.height();

  let above = scrollTop - topOffset;
  let below = (bottomOffset - scrollTop) - viewportHeight;

  return {
    above,
    below,
  };
}

function scrollXPixels(x) {
  $('body').animate({ scrollTop: $(window).scrollTop() + x }, 200);
}

function rawMarkup(lines) {
  return {
    __html: marked(lines.join(""), { sanitize: true, })
  };
}

function resultToHtml(result) {
  if (result.head && result.body) { // this is DataFrame
    let table = "<table>%thead%%tbody%</table>";
    let tHead = createTableHead(result);
    table = table.replace("%thead%", tHead);
    let tBody = createTableBody(result);
    table = table.replace("%tbody%", tBody);

    return table;
  }
}

function createTableHead(data) {
  let {head} = data;
  let result = "<thead><tr><th>&nbsp;</th>%headRows%</tr></thead>"
  let headRows = head.map(h => {
    if (h === data.sort) return "";
    return "<th>" + h + "</th>";
  }).join("");
  return result.replace("%headRows%", headRows);
}

function createTableBody(data) {
  let {head, body, sort} = data;
  let tBody = "<tbody>%tRows%</tbody>"
  let tRows = "";

  for (let rowNumber = 0; rowNumber < data.length; rowNumber++) {
    let i = rowNumber;
    let tRow = "<tr>%tCells%</tr>";
    let tCells = "";
    let firstTCell = "<th>%content%</th>";

    if (sort) {
      tCells += "<th>" + body[sort][rowNumber] + "</th>";
    } else {
      tCells += "<th>" + rowNumber + "</th>";
    }

    head.forEach(h => {
      if (h === sort) return;
      let cell = "<td>%content%</td>"
      let content = body[h][rowNumber];

      if (content && content.toFixed) {
        content = content.toFixed(6);
      }
      tCells += cell.replace("%content%", content || "&nbsp;");
    })

    tRow = tRow.replace("%tCells%", tCells);
    tRows += tRow;
  }

  return tBody.replace("%tRows%", tRows);
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
  var results = new Array(funcs.length);
  var errorEncountered = false;

  funcs.forEach((func, index) => {

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
      results[index] = result;
      completedFuncs++;

      // Is this the last function to complete?
      if (completedFuncs === funcs.length) {
        callback(null, results);
      }
    })

  });
}

function createAsyncDataFetcher(url) {

  return fetch;

  function fetch(callback) {
    $.get(url, function(data) {
      callback(null, data);
    }).fail(function() {
      callback(new Error("Ajax request failed"));
    })
  }
}

function randomName() {
  let names = [ "Albert", "Marie", "Issac", "Charles", "Ada", "Niels", "Nikola", "Lise", "Louis", "Grace", "Gregor", "Rosalind", "Carl" ]
  return randomPick(names);
}

function randomColorGenerator() {
  var lastIndex = 0;
  var colors = ['#1E52AA', '#9E11A8', '#FF8018', '#D6F717'];

  return function(options) {

    options = Object.assign({}, options);
    var not = options.not || [];

    var filteredColors = colors.filter(c1 => not.every(c2 => c1 !== c2));

    if (filteredColors.length) {
      return randomPick(filteredColors);
    }
    return randomPick(colors);

  };
}

function randomPick(ary) {
  return ary[Math.floor((Math.random() * ary.length))];
}


function zip(a, b) {
  return a.map((v, i) => [v, b[i]]);
}
