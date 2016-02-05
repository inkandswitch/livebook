const {
  isCommandJ,
  isCommandX,
  isDelete,
  isEnter,
  isArrowKey,
  isDown,
  isLeft,
  isRight,
  isUp, } = require("./util");

const {
  cutSelectedCodeCell,
  deleteSelectedCodeCell,
  editSelectedCodeCell,
  focusOnSelectedOverlay,
  getSelectedPlaceholder,
  goToNextCodeCell,
  handleCodeCellKeyEvent,
  highlightSelectedCodeCell,
  isCodeCellSelected,
  pasteBelowPlaceholder } = require("./code-cell");

const {
  addPlusButton,
  getLinePosition,
  hidePlusButton,
  highlightLine,
  removeAllLineHighlights,
} = require("./line");

const PLACEHOLDER_ID_BASE = "placeholder";
const PURPLE_PIXEL_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg==";
const TRANS_PIXEL_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII";

function createLivebookExtension({ onChange, getCurrentCode, getCurrentCodeList }) {
    let codeindex;
    let editor = null;

    const focusAPI = {
      focusOnSelectedOverlay: () => focusOnSelectedOverlay(editor), // partially apply original function
      focusEditorOnPlaceholder,
    };

    return {
      init, teardown, 
      forceUpdate, 
      ...focusAPI,
    };

    function forceUpdate(ids) {
      if (ids === undefined) {
        ids = getCurrentCodeList();
      }
      setCodeBlockPositions(ids);
    }

    function focusEditorOnPlaceholder(index, returnFocusToCodeEditor=false) {
      let placeholder = document.getElementById("placeholder"+index);
      editor.selectElement(placeholder);
      highlightSelectedCodeCell(editor);
      hidePlusButton();
      highlightLine(editor);
      if (returnFocusToCodeEditor) {
        // TODO - focus on code editor
      }
      return placeholder;
    }

    function teardown() {
      removePlusButton();
    }

    function destroy() {
      window.removeEventListener("resize", init.resizeHandler);
    }

    function init() {

        editor = this.base;

        removeAllLineHighlights();

        adjustPlaceholderImageColors(editor);

        addPlusButton({
          clickHandler: (_, { line }) => replaceLine(line),
          editor,
        });

        validateContents(editor);

        init.resizeHandler = () => validateContents(editor)
        window.addEventListener("resize",  init.resizeHandler);

        editor.subscribe("editableClick", (_) => {
          if (isCodeCellSelected()) {
            highlightSelectedCodeCell(editor);
          }
          else {
            highlightLine(editor);            
          }
        });

        editor.subscribe("blur", () => { 
          removeAllLineHighlights();
        });

        editor.subscribe("editableInput", () => validateContents(editor) );

        editor.subscribe("editableKeyup", (event) => {
          if (isArrowKey(event)) {
            highlightSelectedCodeCell(editor);
          }

          if (isArrowKey(event) || isDelete(event) || isEnter(event)) {
            highlightLine(editor);
          }

          if (isDelete(event) || isEnter(event)) {
            validateContents(editor);
          }
        });

        editor.subscribe("editableKeydown", (event) => {

          highlightSelectedCodeCell(editor);

          hidePlusButton();

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

          }
        });

        editor.subscribe("editableKeypress", (event) => {
          if (isCodeCellSelected()) {
            handleCodeCellKeyEvent(editor, { event });
            highlightLine(editor);
            hidePlusButton();
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
        let height = overlay.getBoundingClientRect().height;

        placeholder.style.height = Math.floor(height) + "px"

        overlay.style.position = "absolute";
        overlay.style.top = (placeholder.offsetTop) + "px";
        overlay.style.marginTop = "0"; // overrides some default stylings
      });
    }

    // Implements a shitty strategy-like pattern
    // (the strategy depends on whether the cursor is over prose or code)
    function addCodeCell(editor) {
      const index = (codeindex && codeindex++) || 1;
      const html = `<p>${createPlaceholderImgHTML(index)}</p>`;

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
      const html = `<p>${createPlaceholderImgHTML(index)}</p>`;

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
      validateHeading(editor);
      validateSegments(editor);
      removeNestedSpanStyles(editor);


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
      const seenIdsDescending = seen.slice().sort((a, b) => +a <= +b );
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

    function validateSegments(editor) {
      let editorElement = editor.origElements
      let nodes = editorElement.childNodes;
      let seen = []
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        if (node.nodeName !== "#text") {
          let attr = node.getAttribute("livebook-node-id")
          if (attr === null || seen.includes(attr)) { // new or a repeat
            attr = Math.random().toString(36).slice(2)
            node.setAttribute("livebook-node-id",attr)
          }
          seen.push(attr)
        }
      }
    }

    function validateHeading(editor) {
      let editorElement = editor.origElements
      let firstChild  = editorElement.firstChild;
      if (firstChild.tagName !== "H1") {
        let h1 = document.createElement("h1");
        h1.innerHTML = "";
        editorElement.insertBefore(h1, editorElement.firstChild)
      }
      if (firstChild.textContent.trim() === "") {
        firstChild.classList.add("notebook-title-show-placeholder");
      }
      else {
        firstChild.classList.remove("notebook-title-show-placeholder");        
      }
    }

    function removeNestedSpanStyles(editor) {
      // NB this will prob not play nicely with line-highlighting
      const editorElement = editor.origElements;
      const h2Spans = editorElement.querySelectorAll("h2 span[style]");
      [].forEach.call(h2Spans, (span) => {
        span.setAttribute("style", "");
      })
    }

    function adjustPlaceholderImageColors(editor) {
      if (!isProduction()) {
        return;
      }
      const editorElement = editor.origElements;
      const purpleImgs = editorElement.querySelectorAll("[data-livebook-placeholder-cell][src$='"+PURPLE_PIXEL_BASE64+"']");
      [].forEach.call(purpleImgs, function(img) {
        img.src = img.src.replace(PURPLE_PIXEL_BASE64, TRANS_PIXEL_BASE64);
      });
    }

    function createPlaceholderImgHTML(index) {
      const imgBase64 = getPlaceholderImgColor();
      const html = `<img data-livebook-placeholder-cell id="${PLACEHOLDER_ID_BASE}${index}" width="100%" src="data:image/png;base64,${imgBase64}">`;
      return html;
    }

    function getPlaceholderImgColor() {
      if (!isProduction()) {
        // Local and dev (purple pixel)
        return PURPLE_PIXEL_BASE64;
      }
      // Production (transparent pixel)
      return TRANS_PIXEL_BASE64;
    }

    function isProduction() {
      return window.location.host.indexOf("inkandswitch") !== -1;
    }
}

module.exports = createLivebookExtension;
