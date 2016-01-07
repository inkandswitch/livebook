const initialState = {
  codeList: [],
  codeMap: {},
  results: {},
  plots: {},
  errors: {},
  html: [],
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_DOCUMENT': return INITIALIZE_DOCUMENT(state, action);
    case 'CODE_EDITOR_CHANGE':  return CODE_EDITOR_CHANGE(state, action);
    case 'CODE_DELTA':          return CODE_DELTA(state, action);
    case 'NEW_RESULT':          return NEW_RESULT(state, action);
    case 'NEW_PLOTS':           return NEW_PLOTS(state, action);
    case 'NEW_ERRORS':          return NEW_ERRORS(state, action);
    default:
      return state;
  }
};

function remap(map,codeList) {
  let newMap = {}
  for (let key in map) {
    newMap[codeList[key]] = map[key]
  }
  return newMap
}

function INITIALIZE_DOCUMENT(state, action) {
 let { documentProps } = action;
 return {...state, ...documentProps}; 
}

function CODE_DELTA (state, action) {
  let nextCodeMap = {...state.codeMap, ...action.codeDelta};
  return {...state, codeList: action.data.codeList, codeMap: nextCodeMap }
}

function CODE_EDITOR_CHANGE (state, action) {
  let {id, code} = action.data;

  let nextCodeMap = Object.assign({}, state.codeMap);
  nextCodeMap[id] = code;

  let result = Object.assign({}, state, {codeMap: nextCodeMap});
  return result;
}

function NEW_ERRORS(state, action) {
  const errors = remap(action.data,state.codeList)
  return {...state, errors};
}

function NEW_PLOTS(state, action) {
  let next_plots = {...state.plots}
  let next_errors = {...state.errors}
  let next_results = {...state.results}
  let data = remap(action.data,state.codeList)
  for (let cell in data) {
     next_plots[cell] = data[cell]
     delete next_errors[cell]
     delete next_results[cell]
  }
  return {...state, plots: next_plots, errors: next_errors}
}

function NEW_RESULT(state, action) {
  let next_results = {...state.results}
  let next_errors = {...state.errors}
  let next_plots = {...state.plots}
  let data = remap(action.data,state.codeList)
  for (let cell in data) {
     next_results[cell] = data[cell]
     delete next_errors[cell]
     delete next_plots[cell]
  }
  return {...state, results: next_results, errors: next_errors}
}

module.exports = documentReducer;
