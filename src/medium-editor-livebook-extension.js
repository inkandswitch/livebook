const { eventFire } = require("./util");

const PLACEHOLDER_ID_BASE = "placeholder";
function createLivebookExtension(options) {
    let {onChange, getCurrentCode, getCurrentCodeList} = options;

    let codeindex;
    let editor = null;

    return {
      init, teardown, 
      forceUpdate, 
      focusOnSelectedOverlay, focusEditorOnPlaceholder
    };

    function forceUpdate(ids) {
      if (ids === undefined) {
        ids = getCurrentCodeList();
      }
      setCodeBlockPositions(ids);
    }

    function focusOnSelectedOverlay() {
      let codeCell = getSelectedCodeCell();
      if (!codeCell) return;
      let placeholder = codeCellToPlaceholder(codeCell);
      editor.selectElement(placeholder);
    }

    function focusEditorOnPlaceholder(index) {
      let placeholder = document.getElementById("placeholder"+index);
      editor.selectElement(placeholder);
      highlightSelectedCodeCell(editor);
      highlightLine(editor);
    }

    function teardown() {
      removePlusButton();
    }

    function init() {

        editor = this.base;

        removeAllLineHighlights();        

        addPlusButton({
          clickHandler: (_, { line }) => replaceLine(line),
          editor,
        });

        validateContents(editor);
        window.onresize = function() {
          validateContents(editor);
        }

        editor.subscribe("editableClick", (_) => {
          highlightSelectedCodeCell(editor);
          highlightLine(editor);
        });

        editor.subscribe("blur", () => removeAllLineHighlights() );

        editor.subscribe("editableInput", () => validateContents(editor) );

        editor.subscribe("editableKeyup", (event) => {
          if (isArrowKey(event))
            highlightSelectedCodeCell(editor);

          if (isArrowKey(event) || isDelete(event) || isEnter(event)) {
            highlightLine(editor);
          }
        });

        editor.subscribe("editableKeydown", (event) => {

          highlightSelectedCodeCell(editor);

          if (isUp(event) || isDown(event))
              removeAllLineHighlights();

          if (isCommandJ(event)) 
            addCodeCell(editor);

          if (isCodeCellSelected()) {
            if (isEnter(event)) {
              event.stopPropagation();
              event.preventDefault();
              editSelectedCodeCell();
              validateContents(editor);           
            }

            if (isDelete(event))
              deleteSelectedCodeCell(editor);

            if (isCommandX(event))
              cutSelectedCodeCell(editor);

            if (isArrowKey(event))
              handleCodeCellArrowKeyEvent(editor, { event });
          }
        });
    }

    function setCodeBlockPositions(ids) {
      ids.forEach((index) => {
        let overlay = document.getElementById("overlay" + index)
  
        if (!overlay) {
          console.log(`WARNING: No overlays found for index "${index}" - returning early. (livebookExtension)`);
          return;
        }

        let placeholder = document.getElementById(PLACEHOLDER_ID_BASE + index)
        let placeholder_rect = placeholder.getBoundingClientRect();
        let overlay_rect = overlay.getBoundingClientRect();
        let height = overlay_rect.height;

        placeholder.style.height = height + "px"

        overlay.style.position = "absolute";
        overlay.style.top = (placeholder_rect.top + window.scrollY) + "px";
        overlay.style.marginTop = "0"; // overrides some default stylings
      });
    }

    function addCodeCell(editor) {
      const index = (codeindex && codeindex++) || 1;
      const html = `<p><img data-livebook-placeholder-cell id="${PLACEHOLDER_ID_BASE}${index}" width="100%" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg=="></p>`;

      if (isCodeCellSelected()) {
        addHtmlBelowPlaceholder(html, getSelectedPlaceholder());
        return;
      }

      editor.pasteHTML(html, { cleanAttrs: ["style","dir"] });
      syncEditorWithNewCodeCell(editor);
    }

    function addHtmlBelowPlaceholder(html, placeholder) {
      pasteBelowPlaceholder(editor, placeholder, html);
      syncEditorWithNewCodeCell(editor);
      goToNextCodeCell(editor)
    }

    function replaceLine(line) {
      const index = (codeindex && codeindex++) || 1;
      const html = `<p><img data-livebook-placeholder-cell id="${PLACEHOLDER_ID_BASE}${index}" width="100%" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg=="></p>`;

      editor.selectElement(line);
      editor.pasteHTML(html, { cleanAttrs: ["style","dir"] });

      syncEditorWithNewCodeCell(editor);
    }

    function syncEditorWithNewCodeCell(editor) {
      validateContents(editor);
      highlightSelectedCodeCell(editor);
      editSelectedCodeCell();
    }

    function validateContents(editor) {
      let codeDelta = {};
      let codeList = getCurrentCodeList();

      let seen = reducePlaceholders((seen, placeholder) => {
        let id = getPlaceholderId(placeholder);

        let isDuplicate = seen.includes(id);
        let currentCode = getCurrentCode(id);
        let isDeadCode = (currentCode !== undefined) && !codeList.includes(id);

        if (isDuplicate || isDeadCode) {
          let index = (codeindex++).toString();

          codeDelta[index] = currentCode;

          placeholder.id = PLACEHOLDER_ID_BASE + index;

          seen.push(index);
        }
        else {
          seen.push(id);
        }
        return seen;
      });

      // BAD INPUT COULD FUX WITH THIS PLACEMENT
      codeindex = codeindex || getNewCodeindex(seen);

      onChange({
        codeList: seen,
        codeDelta,
      });

      setCodeBlockPositions(seen);
    }

    function getNewCodeindex(seen) {
      const seenIdsDescending = seen.slice().sort((a, b) => +a >= +b );
      const highestId = seenIdsDescending[0]
      return ((+highestId || 0) + 1).toString();
    }

    function reducePlaceholders(f) {
      return getAllPlaceholders().reduce(f, []);
    }

    function getAllPlaceholders() {
      return [].slice.call(document.querySelectorAll("img[data-livebook-placeholder-cell]"));
    }

    function getPlaceholderId(placeholderElt) {
      return placeholderElt.id.replace("placeholder", "");
    }
}

module.exports = createLivebookExtension;

// *** Click-to-add-code-cell Button *** ///
function addPlusButton({ editor, clickHandler }) {
   const button = document.createElement("div");
   const modClickHandler = (event) => {
     const line = getLastHighlightedLineFromButton(button);
     clickHandler(event, { line });
   }
   button.addEventListener("click", modClickHandler);
   initializePlusButton(button);
}

function setLastHighlightedLineOnButton(button, line) {
  button.__LAST_LINE = line;
}

function getLastHighlightedLineFromButton(button) {
  return button.__LAST_LINE;
}

function initializePlusButton(button) {
  button.classList.add("livebook-add-code-button");
  button.dataset.livebookAddCodeButton = "";
  button.innerHTML = "<img src='/plus.svg' height=32 width=32 />";
  button.style.position = "fixed";
  hidePlusButton(button);
  document.body.appendChild(button);
}

function removePlusButton() {
  getPlusButton().remove();
}

function getPlusButton() {
  return document.querySelector("[data-livebook-add-code-button]");
}

function showPlusButton(button) {
  button = button || getPlusButton();
  button.style.visibility = ""; 
}

function hidePlusButton(button) {
  button = button || getPlusButton();
  button.style.visibility = "hidden";
}

function movePlusButton({ editor, line }) {
  const lineContents = line.textContent;
  const butt = getPlusButton();
  if (lineContents.trim() || isCodeCellSelected()) {
    hidePlusButton(butt);
    setLastHighlightedLineOnButton(butt, null);
    return;
  }
  const { top, height } = getLineRect(line);
  const { left } = editor.getFocusedElement().getBoundingClientRect();
  const buttWidth = butt.getBoundingClientRect().width;
  const buttMarginRight = 6;
  const buttMarginTop = -6;

  butt.style.top = (top + buttMarginTop) + "px";
  butt.style.left = (left - buttWidth - buttMarginRight) + "px";
  butt.style.height = (height) + "px";

  butt.__LAST_LINE = line;

  showPlusButton(butt);

  console.log("top, left", top, ",", left)
  console.log("%cBUTT", "font-size: 2em; color: rebeccapurple; padding: .4em 0;", butt)
}

function getLineRect(line) {
  return line.getBoundingClientRect();
}

// *** Line Highlighting *** ///
function highlightLine(editor) {
  const line = getCurrentLineElement(editor);
  if (isCurrentHighlightedLine(line)) return;
  removeAllLineHighlights();
  addLineHighlight(line);
  movePlusButton({ editor, line});
}

function isCurrentHighlightedLine(line) {
  return line === getCurrentHighlightedLine();
}

function getCurrentHighlightedLine() {
  return document.querySelector(".selected-line");
}

function removeAllLineHighlights() {
  let lines = [].slice.call(document.querySelectorAll(".selected-line"));
  lines.forEach(removeLineHighlight);
}

function addLineHighlight(line) {
  line.style.background = "aliceblue";
  line.classList.add("selected-line");  
}

function removeLineHighlight(line) {
  line.style.background = "";
  line.classList.remove("selected-line");
}

function getCurrentLineElement(editor) {
  let line = editor.getSelectedParentElement();
  return line;
}

// *** Code Cell Highlighting *** ///
function highlightSelectedCodeCell(editor) {
  let selectedParent = editor.getSelectedParentElement();
  let placeholder = selectedParent.querySelector("img[data-livebook-placeholder-cell]");

  removeAllCodeCellHighlights();
  hidePlusButton();

  if (placeholder) {
    addCodeCellHighlight(placeholderToCodeCell(placeholder));
  }
}

function removeAllCodeCellHighlights() {
  const activeCodeCells = [].slice.call(document.querySelectorAll(".active-code-cell"));
  activeCodeCells.forEach(removeCodeCellHighlight)
}

function addCodeCellHighlight(elt) {
  elt.classList.add("active-code-cell");
}

function removeCodeCellHighlight(elt) {
  elt.classList.remove("active-code-cell");
}

function isCodeCellSelected() {
  return !!getSelectedCodeCell();
}

function getSelectedCodeCell() {
  return document.querySelector(".active-code-cell");
}

// *** Utilities *** ///
function goToNextCodeCell(editor) {
  let placeholder = getSelectedPlaceholder();
  if (!placeholder) return;
  let nextParent = placeholder.parentNode.nextElementSibling;
  let next = nextParent.querySelector("img");
  if (next) editor.selectElement(next);
  highlightSelectedCodeCell(editor);
}

function placeholderToCodeCell(placeholder) {
  let id = placeholder.id.replace("placeholder", "");
  let codeCell = document.getElementById("overlay" + id);
  return codeCell;
}

function codeCellToPlaceholder(codeCell) {
  let id = codeCell.id.replace("overlay", "");
  let placeholder = document.getElementById("placeholder" + id);
  return placeholder;
}

function getSelectedPlaceholder() {
  let overlay = getSelectedCodeCell();
  return codeCellToPlaceholder(overlay);
}

function cutSelectedCodeCell(editor) {
  let placeholder = getSelectedPlaceholder();
  editor.selectElement(placeholder);
  editor.selectElement(editor.getSelectedParentElement());
  editor.execAction("cut");
}

function deleteSelectedCodeCell(editor) {
  let placeholder = getSelectedPlaceholder();
  editor.selectElement(placeholder);
  editor.selectElement(editor.getSelectedParentElement());
  editor.execAction("delete");
}

function editSelectedCodeCell() {
  let selected = getSelectedCodeCell();
  let code = findCode(selected);
  eventFire(code, "click");
}

function findCode(elt) {
  return elt.querySelector(".code");
}

function handleCodeCellArrowKeyEvent(editor, { event }) {
  if (isDown(event)) {
    let codeCell = getSelectedCodeCell();
    let placeholder = codeCellToPlaceholder(codeCell);
    if (isLastEditorCell(placeholder)) {
      addProseBelow(editor, placeholder);      
    }
  }
}

function addProseBelow(editor, placeholder) {
  pasteBelowPlaceholder(editor, placeholder, "<p><br/></p>");
}

function pasteBelowPlaceholder(editor, placeholder, html) {
  let placeholderParent = placeholder.parentNode;
  editor.selectElement(placeholderParent);
  editor.pasteHTML(placeholderParent.outerHTML + html);
  highlightSelectedCodeCell(editor);
}

function isLastEditorCell(placeholder) {
  let placeholderParent = placeholder.parentNode;
  return !placeholderParent.nextElementSibling;
}

// *** Key code utils ***//
function isEnter({ which }) {
  return which === 13;
}

function isDelete({ which }) {
  let BACKSPACE = 8;
  let DEL = 46;
  return which === BACKSPACE || which === DEL;
}

function isCommandJ({ metaKey, which }) {
  return metaKey && which === 74;
}

function isCommandX({ metaKey, which }) {
  return metaKey && which === 88;
}

function isUp({ which }) {
  return which === 38;
}
function isDown({ which }) {
  return which === 40;
}
function isLeft({ which }) {
  return which === 37;
}
function isRight({ which }) {
  return which === 39;
}

function isArrowKey(event) {
  return [isUp, isDown, isLeft, isRight].some( (p) => p(event) );
}