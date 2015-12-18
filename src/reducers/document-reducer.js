const initialState = {
  codeList: [],
  codeMap: {},
  results: {},
  code: {},
  html: [],
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_DOCUMENT': return INITIALIZE_DOCUMENT(state, action);
    case 'CODE_EDITOR_CHANGE':  return CODE_EDITOR_CHANGE(state, action);
    case 'NEW_RESULT':          return NEW_RESULT(state, action);
    default:
      return state;
  }
};

function INITIALIZE_DOCUMENT(state, action) {
 let { documentProps } = action;
 return Object.assign({}, state, documentProps); 
}

function CODE_EDITOR_CHANGE (state, action) {
  let {id, code} = action.data;

  let nextCodeMap = Object.assign({}, state.codeMap);
  nextCodeMap[id] = code;

  let result = Object.assign({}, state, {codeMap: nextCodeMap});
  return result;
}

function NEW_RESULT(state, action) {
  let {codeListIndex, result} = action.data;
  let nextResults = Object.assign({}, state.results);
  //
  // NB - must turn on level 2 in babel
  //
  // let nextResults = {
  //   ...state.results,
  // };
  let id = state.codeList[codeListIndex];

  if (id === undefined) return state; 

  nextResults[id] = result;
  return Object.assign({}, state, {results: nextResults});
}

module.exports = documentReducer;