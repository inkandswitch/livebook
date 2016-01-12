const initialState = {
  peerCursors: [],
};

const peerReducer = (state = initialState, action) => {
  console.log("DOC:",action.type)
  switch (action.type) {
    case 'UPDATE_PEER_CURSORS': return UPDATE_PEER_CURSORS(state, action);
    default:
      return state;
  }
};

function UPDATE_PEER_CURSORS(state, action) {
  const peerCursors = action.data;
  return { ...state, peerCursors };
}

module.exports = peerReducer;