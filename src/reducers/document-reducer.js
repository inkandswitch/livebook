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
//    case 'NEW_RESULT':          return NEW_RESULT(state, action);
    case 'NEW_RESULTS':         return NEW_RESULTS(state, action);
//    case 'NEW_PLOTS':           return NEW_PLOTS(state, action);
//    case 'NEW_ERRORS':          return NEW_ERRORS(state, action);
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

/*
function NEW_ERRORS(state, action) {
  const errors = remap(action.data,state.codeList)
  return {...state, errors, editor: "me"};
}
*/

/*
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
  return {...state, plots: next_plots, errors: next_errors, editor: "me"}
}
*/

function NEW_RESULTS(state, action) {
//  livebookStore.dispatch({ type: "NEW_RESULTS", index, results, plots, locals, error })
  let { index, results, plots, locals, error } = action

  if (index == 2) {
//    debugger
  }

  index = state.codeList[index]

  let next_results = {...state.results}
  let next_errors = {...state.errors}
  let next_plots  = {...state.plots}
  let next_locals = {...state.locals}

  if (error) {
    next_errors[index] = error
  } else {
    next_locals[index] = locals
    delete next_errors[index]
    if (plots) {
      delete next_results[index]
      next_plots[index] = plots
    } else {
      next_results[index] = results
      delete next_plots[index]
    }
  }

  return {...state, results: next_results, plots: next_plots, errors: next_errors, locals: next_locals, editor: "me"}
}

/*
function NEW_RESULT(state, action) {
  let next_results = {...state.results}
  let next_errors = {...state.errors}
  let next_plots = {...state.plots}
  let results = remap(action.results,state.codeList)
  for (let cell in results) {
     next_results[cell] = results[cell]
     delete next_errors[cell]
     delete next_plots[cell]
  }
  return {...state, results: next_results, errors: next_errors, locals: action.locals, editor: "me"}
}
*/

module.exports = documentReducer;
