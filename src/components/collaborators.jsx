var React = require("react");
var $     = require("jquery");

var CollaboratorNameForm = React.createClass({
  componentDidUpdate() {
    if (this.props.shouldFocus) {
      let input = this.refs.nameInput.getDOMNode();
      input.focus();
    }
  },

  getInitialState() {
    return {
      inputValue: this.props.username,
    }
  },

  getName() {
    let input = this.refs.nameInput;
    let name  = input.getDOMNode().value;
    return name;
  },

  getDisplay() {
    if (this.props.isHidden) {
      return { display: "none", };
    }
    return {};
  },

  getPosition() {
    let form = this.refs.nameForm

    if (!form) return {};

    return {
      border: "solid 2px black",
      padding: ".8em",
      position: "fixed",
      right: 0,
      top: 0,
    }
  },

  getStyles() {
    return $.extend({}, this.getPosition(), this.getDisplay());
  },

  onSubmit(evt) {
    let changeName = this.props.changeName;
    let newName = this.getName();

    changeName(newName)

    evt.stopPropagation();
    evt.preventDefault();
  },

  onTextChange(evt) {
    let name = this.getName();
    this.setState({
      inputValue: name,
    })
  },

  render() {
    let inputValue = this.state.inputValue;
    let styles = this.getStyles();
    return (
      <form style={styles}
        ref="nameForm"
        onSubmit={this.onSubmit}>
        <input type="text" ref="nameInput" value={inputValue} 
            onChange={this.onTextChange} />
        <button>
          Change my name
        </button>
      </form>
    )
  }
});

var Collaborator = React.createClass({

  getInitialState() {
    let f = this.props.f;
    let name = f.session;
    return {
      isEditingName: false,
      name: name,
    }
  },

  onclick() {
    this.setState({ isEditingName: true });
  },

  changeName(name) {
    this.setState({
      isEditingName: false,
      name: name,
    });
  },

  render() {

    let f = this.props.f;
    let connected = (f.connected) ? "!!" : "";
    let cursor = (f.cursor == undefined) ? "?" : f.cursor;
    let name = this.state.name;

    if (f.cursor == undefined) cursor = "?";

      return (
        <li className={"observer " + f.status}
            onClick={this.onclick}>
          <span>
            {name + ":" + cursor + connected}
          </span>
          <CollaboratorNameForm 
            username={this.state.name}
            changeName={this.changeName}
            shouldFocus={this.state.isEditingName}
            isHidden={!this.state.isEditingName} />
        </li>
      );
  }
});

var Collaborators = React.createClass({

  renderAvatars() {
    let avatars = this.props.peers.map((f) => {
      return (
        <Collaborator f={f} />
      );
    })
    return avatars
  },

  render() {
    return (
      <div className="collaborators">
        <ul>{this.renderAvatars()}</ul>
      </div>
    )
  }
});


module.exports = Collaborators;
