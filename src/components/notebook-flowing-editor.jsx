let blacklist = require('blacklist');
let React = require('react');
let ReactDOM = require('react-dom');
let MediumEditor = require('medium-editor');

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

  getInitialState() {
    return {
      text: this.props.text,
    };
  },

  getDefaultProps() {
    return {
      tag: 'div',
    };
  },

  change(text) {
    if(this.props.onChange) this.props.onChange(text, this.medium);
  },

  componentDidMount() {
    let dom = ReactDOM.findDOMNode(this);

    let livebookExtension = createLivebookExtension({
      onChange: this.props.onCodeChange,
      getCurrentCode: this.props.getCurrentCode,
      getCurrentCodeList: this.props.getCurrentCodeList,
    });

    editorOptions.extensions.livebook = livebookExtension;

    this.medium = new MediumEditor(dom, editorOptions);

    this.medium.subscribe('editableInput', (e) => {
      this._updated = true;
      this.change(dom.innerHTML);
    });

    this.medium.subscribe('editableClick', (event) => {
      this.props.onClick();
    });
  },

  componentWillUnmount() {
    this.medium.destroy();
  },

  componentWillReceiveProps(nextProps) {
    if(nextProps.text !== this.state.text && !this._updated) {
      this.setState({text: nextProps.text});
    }

    if(this._updated) this._updated = false;
  },

  render() {
    let tag = this.props.tag;
    let props = blacklist(this.props, 'tag', 'contentEditable', 'dangerouslySetInnerHTML');

    Object.assign(props, {
      contentEditable: true,
      dangerouslySetInnerHTML: {__html: this.state.text}
    });

    return React.createElement(tag, props);
  },

  setupMediumEditor() {

  },
});