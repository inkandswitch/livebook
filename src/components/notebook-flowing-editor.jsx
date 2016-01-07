let blacklist = require('blacklist');
let React = require('react');
let ReactDOM = require('react-dom');
let MediumEditor = require('medium-editor');

let {areMapsEqual} = require("../util");

let createLivebookExtension = require("../medium-editor-livebook-extension");

let editorOptions = {
    buttonLabels: 'fontawesome',
    extensions: {},
    paste: {
        cleanPastedHTML: false,
        forcePlainText: false
    },
    placeholder: "Write some Livebook!"
};

module.exports = React.createClass({
  displayName: 'MediumEditor',

  componentDidMount() {
    let dom = ReactDOM.findDOMNode(this);

    let livebookExtension = createLivebookExtension({
      onChange: this.props.onCodeChange,
      getCurrentCode: (id) => this.doc().codeMap[id],
      getCurrentCodeList: () => this.doc().codeList,
    });

    this.props.assignForceUpdate(livebookExtension.forceUpdate);
    this.props.assignFocusOnSelectedOverlay(livebookExtension.focusOnSelectedOverlay);
    this.props.assignFocusEditorOnPlaceholder(livebookExtension.focusEditorOnPlaceholder);

    editorOptions.extensions.livebook = livebookExtension;

    this.medium = new MediumEditor(dom, editorOptions);

    this.medium.subscribe('editableInput', (e) => {
      // ??
    });

    this.medium.subscribe('editableClick', (event) => {
      this.props.onClick();
    });
  },

  componentWillUnmount() {
    this.medium.destroy();
  },

  shouldComponentUpdate() {
    return false;
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

    return React.createElement('div', props);
  },
});
