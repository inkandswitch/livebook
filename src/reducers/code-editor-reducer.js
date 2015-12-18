const initialEditorState = {
  hidden: true,
  code: "",
};

const codeEditorReducer = (state = initialEditorState, action) => {
  switch (action.type) {
    case 'CODE_EDITOR_CHANGE':
      let {code} = action.data;
      return Object.assign({}, state, {code});


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