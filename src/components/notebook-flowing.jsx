const React = require('react');
const ReactDOM = require('react-dom');
const Helmet = require('react-helmet');
const CodeOverlaysContainer = require("./code-cell-overlays-container");
const Editor = require('./notebook-flowing-editor');
const Collaborators = require("./collaborators");

const { htmlDecode } = require("../util");

const NotebookV2 = React.createClass({

  handleOverlayMount() {
    this.forceUpdate();
  },

  render() {
    const path = window.location.pathname;
    const isFullOfStuff = path !== "/" && path.indexOf("/upload") !== 0;

    if (isFullOfStuff) {
      return (
        <div className="notebook">{ this.renderEditorAndOverlays()}</div>
      ); 
    }

    return (
      <div className="notebook"></div>
    );
  },

  renderEditorAndOverlays() {
    let { title } = this.props.store.getState().doc;
    if (title.trim() ===  "<br>") {
      title = "(untitled notebook)";
    }
    else {
      title = htmlDecode(title);
    }

    return (
      <div className="editor-wrapper" data-livebook-editor-wrapper="true">
        <Helmet title={title} />
        <CodeOverlaysContainer
          getColor={this.props.getColor}
          peers={this.props.getPeers()}
          store={this.props.store}
          handleOverlayMount={this.handleOverlayMount}
          focusOnSelectedOverlay={this.props.focusOnSelectedOverlay}
          focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder}/>
        <Collaborators peers={this.props.getPeers()}/>
        <Editor
          store={this.props.store}
          assignForceUpdate={this.props.assignForceUpdate}
          assignFocusOnSelectedOverlay={this.props.assignFocusOnSelectedOverlay}
          assignFocusEditorOnPlaceholder={this.props.assignFocusEditorOnPlaceholder}/>
      </div>
    );
  }
});

module.exports = NotebookV2;
