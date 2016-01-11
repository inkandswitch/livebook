const initialEditorState = {
  hidden: true,
  index: undefined,
};

const codeEditorReducer = (state = initialEditorState, action) => {
  switch (action.type) {
    case 'OPEN_CODE_EDITOR':
      let { editorProps } = action;
      return {...state, ...editorProps, hidden: false };

    case 'CLOSE_CODE_EDITOR':
      return { hidden: true, index: undefined, };

    default:
      return state;
  }
};

module.exports = codeEditorReducer;
