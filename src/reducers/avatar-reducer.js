const initialState = {
  position: {},
};

const avatarReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'MOVE_AVATAR': return MOVE_AVATAR(state, action);
    default:            return state;
  }
};

module.exports = avatarReducer;

function MOVE_AVATAR(state, action) {
  const { position } = action;
  return { ...state, position };
}