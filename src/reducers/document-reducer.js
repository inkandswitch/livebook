const initialState = {
  codeList: [],
  codeMap: {},
  results: {},
  code: {},
  html: [],
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_DOCUMENT':
      let { documentProps } = action;
      return Object.assign({}, state, documentProps);

    case 'CODE_EDITOR_CHANGE':
      let {id, code} = action.data;
      let nextCodeMap = Object.assign({}, state.codeMap);
      nextCodeMap[id] = code;
      let result = Object.assign({}, state, {codeMap: nextCodeMap});
      return result;
    default:
      return state;
  }
};

module.exports = documentReducer;