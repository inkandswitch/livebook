const initialState = {
  codeList: [],
  codeMap: {},
  results: {},
  errors: {},
  html: [],
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_DOCUMENT': return INITIALIZE_DOCUMENT(state, action);
    case 'CODE_EDITOR_CHANGE':  return CODE_EDITOR_CHANGE(state, action);
    case 'NEW_RESULT':          return NEW_RESULT(state, action);
    case 'NEW_ERRORS':          return NEW_ERRORS(state, action);
    default:
      return state;
  }
};

function INITIALIZE_DOCUMENT(state, action) {
 let { documentProps } = action;
 return {...state, ...documentProps}; 
}

function CODE_EDITOR_CHANGE (state, action) {
  let {id, code} = action.data;

  let nextCodeMap = Object.assign({}, state.codeMap);
  nextCodeMap[id] = code;

  let result = Object.assign({}, state, {codeMap: nextCodeMap});
  return result;
}

function NEW_ERRORS(state, action) {
  const errors = action.data
  return {...state, errors};
}

function NEW_RESULT(state, action) {
  let next_results = {...state.results}
  let next_errors = {...state.errors}
  for (let cell in action.data) {
     next_results[cell] = action.data[cell]
     delete next_errors[cell]
  }
  return {...state, results: next_results, errors: next_errors}
}

module.exports = documentReducer;
