module.exports = {
  isCommandJ,
  isCommandX,
  isDelete,
  isEnter,
  isEscape,
  isArrowKey,
  isDown,
  isLeft,
  isRight,
  isUp,
};

function isCommandJ({ metaKey, which }) {
  return metaKey && which === 74;
}

function isCommandX({ metaKey, which }) {
  return metaKey && which === 88;
}

function isDelete({ which }) {
  let BACKSPACE = 8;
  let DEL = 46;
  return which === BACKSPACE || which === DEL;
}

function isEnter({ which }) {
  return which === 13;
}

function isEscape({ which }) {
  return which === 27;
}

function isArrowKey(event) {
  return [isUp, isDown, isLeft, isRight].some( (p) => p(event) );
}

function isDown({ which }) {
  return which === 40;
}

function isLeft({ which }) {
  return which === 37;
}

function isRight({ which }) {
  return which === 39;
}

function isUp({ which }) {
  return which === 38;
}