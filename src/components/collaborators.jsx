var React  = require("react");
var extend = require("jquery").extend;
var cradle = require("../cradle");

var CollaboratorNameForm = React.createClass({
  componentDidUpdate() {
    if (this.props.shouldFocus) {
      let input = this.refs.nameInput.getDOMNode();
      input.focus();
    }
  },

  getInitialState() {
    return {
      inputValue: this.props.username, // NOT a react anti-pattern; this only needs to be sync'd at first
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
    return {
      // background: "white",
      // border: "solid 2px #222",
      // padding: ".8em",
      // position: "absolute",
      // right: 0,
      // top: 48, // magic number
      // zIndex: 1,
    }
  },

  getStyles() {
    return extend({}, this.getPosition(), this.getDisplay());
  },

  onSubmit(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let handleNameChange = this.props.handleNameChange;
    let newName = this.getName();

    handleNameChange(newName)
  },

  onTextChange(evt) {
    let name = evt.target.value;
    this.setState({
      inputValue: name,
    })
  },

  render() {
    let inputValue = this.state.inputValue;
    let styles = this.getStyles();
    return (
      <div className="collaborators-name-change-form-wrap"
        style={styles}>
        <form className="collaborators-name-change-form"
          ref="nameForm"
          onSubmit={this.onSubmit}>
          <p>
            What's your name?
          </p>
          <input type="text" ref="nameInput" value={inputValue} 
              onChange={this.onTextChange} />
          <button>
            Save
          </button>
        </form>
      </div>
    )
  }
});

var Collaborator = React.createClass({

  getInitialState() {
    let peer = this.props.peer; // possible react anti-pattern
    let name = peer.name || peer.session;

    return {
      isEditingName: false,
      name: name,
    }
  },

  handleClick() {
    this.setState({ isEditingName: true });
  },

  handleNameChange(name) {
    let oldName = this.state.name;

    this.setState({
      isEditingName: false,
      name: name,
    });

    // send user name to server
    cradle.config({
      name: name,
    });
  },

  render() {

    let peer = this.props.peer;
    let connected = (peer.connected) ? "!!" : "";
    let cursor = (peer.cursor == undefined) ? "?" : peer.cursor;
    let name = this.state.name;

    if (peer.cursor == undefined) cursor = "?";

      return (
        <li className={"observer " + peer.status}
            onClick={this.handleClick}>
          <span>
            {name + ":" + cursor + connected}
          </span>
          <CollaboratorNameForm 
            username={this.state.name}
            handleNameChange={this.handleNameChange}
            shouldFocus={this.state.isEditingName}
            isHidden={!this.state.isEditingName} />
        </li>
      );
  }
});

var Collaborators = React.createClass({

  renderAvatars() {
    let avatars = this.props.peers.map((peer) => {
      return (
        <Collaborator peer={peer} />
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
