const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg==";

var React = require('react');

var $ = require("jquery");
var marked = require("marked");
// var toMarkdown =  require("to-markdown");
var toMarkdown = () => {}; //require('html-md');

module.exports = {
    iPyToHTML,
    docToIPy,
};

function iPyToHTML(ipy) {
  let codeMap = {}
  let codeList = []
  let index = 0
  let html = ipy.cells.map((cell) => {
    if (cell.cell_type == "markdown") {
      return marked(cell.source.join("\n"))
    } else {
      index += 1
      codeMap[index] = cell.source.join("");
      codeList.push("" + index)
      return `<p><img data-livebook-placeholder-cell id="placeholder${index}" width="100%" src="${PNG}"></p>`
    }
  }).join("\n")

  return { html, codeMap, codeList };
}

function docToIPy(doc) {
  let htmlChunks = doc.html.split(/<p><img data-livebook-placeholder-cell [^>]*><\/p>/)
  let textChunks = htmlChunks.map((chunk) => $(chunk).text())
  let markCells  = textChunks.map(textToMDCell)
  let codeChunks = doc.codeList.map((index) => doc.codeMap[index])
  let codeCells  = codeChunks.map(codeToCodeCell)
  let cells      = []
  for (let i in markCells) cells[i*2]   = markCells[i]
  for (let i in codeCells) cells[i*2+1] = codeCells[i]
  return {
     cells: cells,
     metadata: {
      kernelspec: {
       display_name: "Python 2",
       language: "python",
       name: "python2"
      },
      language_info: {
       codemirror_mode: {
        name: "ipython",
        version: 2
       },
       file_extension: ".py",
       mimetype: "text/x-python",
       name: "python",
       nbconvert_exporter: "python",
       pygments_lexer: "ipython2",
       version: "2.7.10"
      }
     },
     nbformat: 4,
     nbformat_minor: 0
  }
}

function nbSplit(text) {  // split the lines, leave the \n
  return text.match(/[^\n]*(\n|[^\n]$)/g) || []
}

function codeToCodeCell(code) {
  return {
   cell_type: "code",
   execution_count: null,
   metadata: {
    collapsed: true
   },
   outputs: [],
   source: nbSplit(code)
  }
}

function textToMDCell(text) {
  return {
   cell_type: "markdown",
   metadata: {},
   source: nbSplit(text)
  }
}

function htmlToIPy(html) {
  // FIXME
  let contents = document.querySelector("[data-medium-editor-element='true']").children;
  let cells = reduceEditorContentsToCells(contents);
  return { cells };
}

function reduceEditorContentsToCells(htmlCollection) {
  return reduceDOMCollection(htmlCollection, cellReducer, []);
}

function cellReducer(cells, elt) {
  if (hasCodePlaceholder(elt)) {
    let placeholder = elt.querySelector("[data-livebook-placeholder-cell]");
    let codeCell = createCodeCellFromPlaceholder(placeholder);
    cells.push(codeCell);
  }
  else {

    let lastCell = cells[cells.length - 1];
    let htmlString = toHTML(elt);
    let markdown = toMarkdown(htmlString);
    let nextCellSource = markdown.split("\n");

    if (lastCell && lastCell.cell_type === "markdown") {
        // append markdown to previous cell instead of adding a new cell
        lastCell.source = [lastCell.source, ...nextCellSource];
    }
    else {
        // the last cell was full of code!
        // we will have to add a new markdown cell
        let nextCell = newMarkdownCell();
        nextCell.source = nextCellSource;
        cells.push(nextCell);
    }
  }
  return cells;
}

function createCodeCellFromPlaceholder(elt) {
  // TODO
  return {
    cell_type: "code",
    source: ["pythonnnnnnnnnnnnn yay python"],
  };
}

function newMarkdownCell() {
  return { cell_type: "markdown", source: [] };
}

function hasCodePlaceholder(elt) {
  if (!elt.querySelector) return false;
  return !!elt.querySelector("[data-livebook-placeholder-cell]");
}

function reduceDOMCollection(collection, f, init) {
  return [].reduce.call(collection, f, init);
}

function toHTML(elt) {
    // if (!elt || !elt.tagName) {
    //   debugger;
    // };

    // let result, 
    //     tempContainer = document.createElement("div");

    // tempContainer.appendChild(elt.cloneNode(false));
    // result = tempContainer.innerHTML;
    // tempContainer = null;
    // return result;
    return elt.outerHTML;
}
