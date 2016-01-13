const getPeers = require("../cradle").peers;

const initialState = {
  positions: {},
};

const avatarReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'MOVE_AVATAR'             : return MOVE_AVATAR(state, action);
    case 'MOVE_CURRENT_USER_AVATAR': return MOVE_CURRENT_USER_AVATAR(state, action);
    default                        : return state;
  }
};

module.exports = avatarReducer;

function MOVE_AVATAR(state, action) {
  const { id, position } = action;
  const nextPosition = {};
  nextPosition[id] = position;
  const positions = { ...state.positions, ...nextPosition };

  return { ...state,  positions };
}

function MOVE_CURRENT_USER_AVATAR(state, action) {
  const { position } = action;
  const id = getPeers()[0].session;
  const nextPosition = {};
  nextPosition[id] = position;
  const positions = { ...state.positions, ...nextPosition };
  
  return { ...state, positions };
}