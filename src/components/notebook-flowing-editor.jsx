let blacklist = require('blacklist');
let React = require('react');
let ReactDOM = require('react-dom');
let MediumEditor = require('medium-editor');
let Cradle = require('../cradle');

let CURSOR;

require("../medium-editor-extensions/heading-button/")(MediumEditor); // modify default h2 button prototype

const { areMapsEqual, eventFire } = require("../util");

const createLivebookExtension = require("../medium-editor-extensions/medium-editor-livebook-extension/");

let editorOptions = {
    buttonLabels: 'fontawesome',
    extensions: {},
    paste: {
        cleanPastedHTML: false,
        forcePlainText: false
    },
    placeholder: "Write some Livebook!",
    toolbar: {
      buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'quote'],
    },
};

module.exports = React.createClass({
  displayName: 'MediumEditor',

  componentDidMount() {
    let dom = ReactDOM.findDOMNode(this);

    let changeCounter = 0; // CODE_DELTA will trigger a document save - we want to skip the first onChange

    const livebookExtensionOnChange = (data) => {
      if (changeCounter++ > 0) 
        this.props.store.dispatch({ type: "CODE_DELTA", data })
    };
    
    const moveAvatar = (position) => {
      const type = "MOVE_AVATAR";
      this.props.store.dispatch({ type, position });
    };

    let livebookExtension = createLivebookExtension({
      moveAvatar,
      onChange: livebookExtensionOnChange,
      getCurrentCode: (id) => this.doc().codeMap[id],
      getCurrentCodeList: () => this.doc().codeList,
    });
    this.props.assignForceUpdate(livebookExtension.forceUpdate);
    this.props.assignFocusOnSelectedOverlay(livebookExtension.focusOnSelectedOverlay);
    this.props.assignFocusEditorOnPlaceholder(livebookExtension.focusEditorOnPlaceholder);

    editorOptions.extensions.livebook = livebookExtension;

    this.medium = new MediumEditor(dom, editorOptions);

    this.medium.subscribe('editableInput', (e) => {
      let html = dom.innerHTML;
      this.props.store.dispatch({ type: "UPDATE_HTML", html })
    });

    this.medium.subscribe('editableClick', (event) => {
      this.props.onClick();
    });
  },

  componentWillReceiveProps(nextProps) {
    const store = nextProps.store;
    const state = store.getState();
    const peerState = state.peer;
    const cursors = peerState.peerCursors;
    cursors.forEach((c) => {
      let {color, nodeId, peerId } = c;
      if (nodeId == null) return;
      let node = document.querySelector("[livebook-node-id='"+nodeId+"']");
      if (!node) return;
      if (node.dataset.livebookSessions === undefined) {
        node.dataset.livebookSessions = "";        
      }
      peerId = peerId || "xxxxxx"

      let lastSelected = [].slice.call(document.querySelectorAll("[data-livebook-sessions*='"+peerId+"']"));
      lastSelected.forEach(function(domNode) {
        domNode.dataset.livebookSessions = domNode.dataset.livebookSessions.replace(peerId, "");
      });

      node.dataset.livebookSessions += peerId;

      let head = document.querySelector("head");
      let style = document.createElement("style");
      style.innerHTML = "[data-livebook-sessions*='"+peerId+"'] { background:"+color+" !important; }"
      head.appendChild(style);
      // current user select through having _no session_
      // debugger;
      // "[livebook-sessions*='oursessionvalue']"
      // "{livebook-sessions}" += newSession
      // "{livebook-sessions}"  =  "{livebook-sessions}".replace(session, "")

      // node.style.background = color;
    });
  },

  componentWillUnmount() {
    this.medium.destroy();
  },

  componentWillUpdate() {
  },

  componentDidUpdate() {
    this.medium.importSelection(CURSOR)
    editorOptions.extensions.livebook.forceUpdate()
  },

  shouldComponentUpdate() {
    CURSOR = this.medium.exportSelection()
    console.log("CURSOR", CURSOR)
    // ---
    const line = document.querySelector(".selected-line");
    if (line !== null) {
      const nodeId = line.getAttribute('livebook-node-id')
      Cradle.setSessionVar('cursor', nodeId)
    }
    // ---

    return this.doc().editor != "me";
  },

  doc() {
    return this.props.store.getState().doc
  },

  render() {
    let props = blacklist(this.props, 'tag', 'contentEditable', 'dangerouslySetInnerHTML');

    Object.assign(props, {
      contentEditable: true,
      dangerouslySetInnerHTML: {__html: this.doc().html}
    });

    return (
      <div {...props} />
    );
  },
});
