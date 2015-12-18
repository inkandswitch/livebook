const initialEditorState = {
  hidden: true,
  code: "",
};

const codeEditorReducer = (state = initialEditorState, action) => {
  switch (action.type) {
    case 'OPEN_CODE_EDITOR':
      let { editorProps } = action;
      let hidden = false;
      return Object.assign({}, state, editorProps, { hidden });
    case 'CLOSE_CODE_EDITOR':
      return { hidden: true, code: "", };
    default:
      return state;
  }
};

module.exports = codeEditorReducer;