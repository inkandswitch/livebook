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
  handleCodeCellArrowKeyEvent,
  highlightSelectedCodeCell,
  isCodeCellSelected, } = require("./code-cell");

const {
  addPlusButton,
  hidePlusButton,
  highlightLine,
  removeAllLineHighlights,
} = require("./line");

const PLACEHOLDER_ID_BASE = "placeholder";

function createLivebookExtension({onChange, getCurrentCode, getCurrentCodeList}) {
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

    function focusEditorOnPlaceholder(index) {
      let placeholder = document.getElementById("placeholder"+index);
      editor.selectElement(placeholder);
      highlightSelectedCodeCell(editor);
      hidePlusButton();
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

    // Implements a shitty 'strategy'-esque pattern
    // (the strategy depends on whether there cursor is over prose or code)
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
}

module.exports = createLivebookExtension;