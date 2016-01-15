

module.exports = {
  init() {
    const editor = this.base;

    editor.subscribe("editableClick", meh);
    editor.subscribe("editableKeyup", meh);

    function meh(event) {
      const sel = editor.getSelectedParentElement();
      if (sel.tagName === "H1") {
        editor.stopSelectionUpdates();
      }
      else {
        editor.startSelectionUpdates();
      }
    }
  }
}
