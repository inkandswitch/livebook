const PLACEHOLDER_ID_BASE = "placeholder";

function createLivebookExtension(options) {
    let {onChange, getCurrentCode, getCurrentCodeList} = options;

    let codeindex;

    let result = { init, checkState, forceUpdate, focusOnSelectedOverlay, focusEditorOnPlaceholder };
    let editor = null;

    return result;

    function forceUpdate(ids) {
      if (ids === undefined) {
        ids = getCurrentCodeList();
      }
      setCodeBlockPositions(ids);
    }

    function focusOnSelectedOverlay() {
      let codeCell = getSelectedCodeCell();
      let placeholder = codeCellToPlaceholder(codeCell);
      editor.selectElement(placeholder);
    }

    function focusEditorOnPlaceholder(index) {
      let placeholder = document.getElementById("placeholder"+index);
      editor.selectElement(placeholder);
      highlightSelectedCodeCell(editor);
    }

    function init() {
        // Called by MediumEditor during initialization. 
        // The .base property will already have been set to current instance of MediumEditor when this is called.
        // All helper methods will exist as well.
        editor = this.base;

        editor.subscribe("editableKeydown", (event) => { if (isCommandJ(event)) addCodeCell(editor); });
        editor.subscribe("editableKeyup", (event) => { if (isArrowKey(event)) highlightSelectedCodeCell(editor); });
        editor.subscribe("editableClick", (_) => { highlightSelectedCodeCell(editor); });
        editor.subscribe("editableInput", (_) => { validateContents(editor); });

        editor.subscribe("editableKeydown", (event) => {
          if (isCodeCellSelected()) {
            if (isEnter(event)) {
              event.stopPropagation();
              event.preventDefault();
              editSelectedCodeCell();
              validateContents(editor);           
            }

            if (isDelete(event)) {
              // TODO - delete from codemap???
              deleteSelectedCodeCell(editor);
              // validateContents(editor);
            }

            if (isArrowKey(event)) {
              handleCodeCellArrowKeyEvent(editor, { event });
            }
          }
        });

        validateContents(editor);
        window.onresize = function() {
          validateContents(editor);
        }
    }

    function checkState(node) {

        // If implemented, this method will be called one or more times after the state of the editor & toolbar are updated. When the state is updated, the editor does the following:

        // 1. Find the parent node containing the current selection
        // 2. Call checkState(node) on each extension, passing the node as an argument
        // 3. Get the parent node of the previous node
        // 4. Repeat steps #2 and #3 until we move outside the parent contenteditable
    }

    function setCodeBlockPositions(ids) {
      console.log("SET CODE BLOCK", ids);
      ids.forEach((index) => {
        let overlay = document.getElementById("overlay" + index)
  
        if (!overlay) {
          console.log("No overlays found - returning early. (livebookExtension)");
          return;
        }

        let placeholder = document.getElementById(PLACEHOLDER_ID_BASE + index)
        let placeholder_rect = placeholder.getBoundingClientRect();
        let overlay_rect = overlay.getBoundingClientRect();
        let height = overlay_rect.height;

        // console.log("placeholder_rect",placeholder_rect)
        // console.log("overlayrect",overlay_rect)

        placeholder.style.height = height + "px"

        overlay.style.position = "absolute";
        overlay.style.top = (placeholder_rect.top + window.scrollY) + "px";
        // overlay.style.left = placeholder_rect.left + "px";
        overlay.style.marginTop = "0"; // overrides some default stylings

        // overlay.style.width = placeholder_rect.width + "px";

        // let overlay_rect2 = overlay.getBoundingClientRect();
        // let placeholder_rect2 = placeholder.getBoundingClientRect();
      })
    }

    function addCodeCell(editor) {
      // BAD INPUT COULD FUX WITH THIS PLACEMENT
      const index = (codeindex && codeindex++) || 1;
      editor.pasteHTML(`<p><img data-livebook-placeholder-cell id="${PLACEHOLDER_ID_BASE}${index}" width="100%" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg=="></p>`,{ cleanAttrs: ["style","dir"], })
      validateContents(editor);
      highlightSelectedCodeCell(editor);
      editSelectedCodeCell();
    }

    function validateContents(editor) {
      let codeDelta = {};
      let prevCodeList = getCurrentCodeList();

      let seen = reducePlaceholders((seen, placeholder) => {
        let id = getPlaceholderId(placeholder);

        let isDuplicate = seen.includes(id);
        let currentCode = getCurrentCode(id);
        let isDeadCode = (currentCode !== undefined) && !prevCodeList.includes(id);

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

      console.log("seen", seen);
      console.log("prevCodeList", prevCodeList)

      setCodeBlockPositions(seen);
    }

    function getNewCodeindex(seen) {
      const seenIdsDescending = seen.slice().sort((a, b) => +a >= +b );
      const highestId = seenIdsDescending[0]
      return (highestId || 0) + 1;
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

function highlightSelectedCodeCell(editor) {
  let selectedParent = editor.getSelectedParentElement();
  let placeholder = selectedParent.querySelector("img[data-livebook-placeholder-cell]");

  removeOldHighlights();

  if (placeholder) {
    addHighlight(placeholderToCodeCell(placeholder));
  }
}

function removeOldHighlights() {
  [].forEach.call(document.querySelectorAll(".active-code-cell"), removeHighlight)
}

function addHighlight(elt) {
  elt.classList.add("active-code-cell");
}

function removeHighlight(elt) {
  elt.classList.remove("active-code-cell");
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

function isCodeCellSelected() {
  return !!getSelectedCodeCell();
}

function getSelectedCodeCell() {
  return document.querySelector(".active-code-cell");
}

function deleteSelectedCodeCell(editor) {
  let selected = getSelectedCodeCell();
  let placeholder = codeCellToPlaceholder(selected);
  editor.selectElement(placeholder);
  editor.selectElement(editor.getSelectedParentElement());
  editor.execAction("delete");
}

function editSelectedCodeCell() {
  let selected = getSelectedCodeCell();
  let code = findCode(selected);
  eventFire(code, "click");
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
  let placeholderParent = placeholder.parentNode;
  editor.selectElement(placeholderParent);
  let html = placeholderParent.outerHTML;
  editor.pasteHTML(placeholderParent.outerHTML + "<p><br/></p>");
  highlightSelectedCodeCell();
}

function isLastEditorCell(placeholder) {
  let placeholderParent = placeholder.parentNode;
  return !placeholderParent.nextElementSibling;
}

function isEnter(event) {
  let ENTER = 13;
  return event.which === ENTER;
}

function isDelete(event) {
  let BACKSPACE = 8;
  let DEL = 46;
  return event.which === BACKSPACE || event.which === DEL;
}

function isCommandJ(event) {
  let J = 74;
  return event.metaKey && event.which === J;
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

function findCode(elt) {
  return elt.querySelector(".code");
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
