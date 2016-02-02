const BLUE   = "#678FB5";
const VIOLET = "#944770";
const GREEN  = "#88A555";
const BROWN  = "#CCA978";

const COLORS = [
    BLUE,
    VIOLET,
    GREEN,
    BROWN,
];

const COLOR_MAP = createColorMap();

let $ = require("jquery");
let marked = require("marked");
let randomColor = randomColorGenerator();


module.exports = {
  areMapsEqual,
  asyncRunParallel,
  COLOR_MAP,
  COLORS,
  createAsyncDataFetcher,
  deepClone,
  eventFire,
  getPixelsBeyondFold,
  htmlDecode,
  isArray,
  noop: () => {},
  randomColor,
  randomName,
  rawMarkup,
  resultToHtml,
  scrollXPixels,
  stopTheBubbly,
  zip,
};

function areMapsEqual(m1, m2) {
  let k1 = Object.keys(m1);
  let k2 = Object.keys(m2);
  if (k1.length !== k2.length) return false;
  return k1.every( k => m1[k] === m2[k]);
}

function createColorMap() {
  const ACCENT_BLUE = "hsla(209.2, 52.9%, 27.5%, 1)";
  const COLOR_MAP = { lines: {}, cells: {} };

  COLOR_MAP.lines[BLUE] =  "hsla(209.2, 52.9%, 27.5%, .1)";
  COLOR_MAP.cells[BLUE] = "hsla(209.2, 52.9%, 27.5%, .25)";

  COLOR_MAP.lines[VIOLET] = "hsla(327.9, 46.8%, 24.3%, .1)";
  COLOR_MAP.cells[VIOLET] = "hsla(327.9, 46.8%, 24.3%, .25)";

  COLOR_MAP.lines[GREEN] = "hsla(81.8, 46.5%, 27.8%, .1)";
  COLOR_MAP.cells[GREEN] = "hsla(81.8, 46.5%, 27.8%, .25)";

  COLOR_MAP.lines[BROWN] = "hsla(35.5, 46.4%, 30%, .1)";
  COLOR_MAP.cells[BROWN] = "hsla(35.5, 46.4%, 30%, .25)";

  return COLOR_MAP
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

function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
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
  let colors = [...COLORS];

  return function(options) {
    options = { not: [], ...options };

    let { not } = options;
    let filteredColors = colors.filter(c1 => not.every(c2 => c1 !== c2));

    if (not.length === 0 || filteredColors.length === 0)
      return randomPick(colors);
    
    return randomPick(filteredColors);

  };
}

function randomPick(ary) {
  return ary[Math.floor((Math.random() * ary.length))];
}


function stopTheBubbly(event) {
  event.preventDefault();
  event.stopPropagation();
}

function zip(a, b) {
  return a.map((v, i) => [v, b[i]]);
}
