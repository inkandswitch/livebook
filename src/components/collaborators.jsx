var $      = require("jquery");
var React  = require("react");
var extend = require("jquery").extend;
var cradle = require("../cradle");

var setMode;

var ModalBackground = React.createClass({
  getStyles() {
    let result = {
      background: "hsla(0, 0%, 0%,.2)",
      position: "fixed",
      height: "100%",
      left: 0,
      top: 0,
      width: "100%",
    };

    if (this.props.isHidden) {
      result.display = "none";
    }

    return result;
  },

  render() {
    return (
      <div style={this.getStyles()} onClick={this.props.handleClick} />
    );
  }
});

var CollaboratorNameForm = React.createClass({
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.shouldFocus && this.props.shouldFocus) {
      let input = this.refs.nameInput.getDOMNode();
      input.select();
      setMode("meta");
    }
    if (prevProps.shouldFocus && !this.props.shouldFocus) {
      setMode("nav");
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

  handleTextChange(evt) {
    let name = evt.target.value;
    this.setState({
      inputValue: name,
    })
  },

  render() {
    let inputValue = this.state.inputValue;
    let styles = this.getStyles();
    return (
      <div>
        <ModalBackground handleClick={this.props.exitModal} isHidden={this.props.isHidden} />
        <div className="collaborators-name-change-form-wrap"
          style={styles}>
          <form className="collaborators-name-change-form"
            ref="nameForm"
            onSubmit={this.onSubmit}>
            <p>
              What's your name?
            </p>
            <input class="js-user-name-input" type="text" ref="nameInput" value={inputValue} 
                onChange={this.handleTextChange} />
            <button>
              Save
            </button>
          </form>
        </div>
      </div>
    )
  }
});

var Collaborator = React.createClass({

  exitModal(event) {
    this.setState({
      isEditingName: false,
    });
    event.stopPropagation();
  },

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
    cradle.configure({
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
            exitModal={this.exitModal}
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

function injectSetMode(injectedSetMode) {
  setMode = injectedSetMode;
  return Collaborators;
}


module.exports = injectSetMode;
