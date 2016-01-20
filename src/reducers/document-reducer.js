const initialState = {
  codeList: [],
  codeMap: {},
  errors: {},
  html: "",
  title: "",
  plots: {},
  locals: {},
  results: {},
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INITIALIZE_DOCUMENT': return INITIALIZE_DOCUMENT(state, action);
    case 'CODE_DELTA':          return CODE_DELTA(state, action);
    case 'NEW_RESULTS':         return NEW_RESULTS(state, action);
    case 'UPDATE_HTML':         return UPDATE_HTML(state, action);
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
 let { documentProps, editor } = action;
 return {...state, ...documentProps, editor: editor };
}

function UPDATE_HTML (state, action) {
  let { html, title } = action;
  return {...state, html, title, editor: "me" }
}

function CODE_DELTA (state, action) {
  let nextCodeMap = {...state.codeMap, ...action.data.codeDelta};
  return {...state, codeList: action.data.codeList, codeMap: nextCodeMap, editor: "me" }
}

function NEW_RESULTS(state, action) {
  let { index, results, plots, locals, error } = action

  index = state.codeList[index]

  let next_results = {...state.results}
  let next_errors = {...state.errors}
  let next_plots  = {...state.plots}
  let next_locals = {...state.locals}

  if (error) {
    next_errors[index] = error
  } else {
    next_locals[index] = locals
    next_results[index] = results
    next_plots[index] = plots
    delete next_errors[index]
  }

  return {...state, results: next_results, plots: next_plots, errors: next_errors, locals: next_locals, editor: "me"}
}

module.exports = documentReducer;
