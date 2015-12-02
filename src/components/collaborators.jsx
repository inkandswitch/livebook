var $      = require("jquery");
var React  = require("react");
var extend = require("jquery").extend;
var cradle = require("../cradle");

var setMode;

var ModalBackground = React.createClass({
  getStyles() {
    let result = {
      background: "hsla(0, 0%, 0%, .3)",
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
    // We are showing the form
    if (!prevProps.shouldFocus && this.props.shouldFocus) {
      let input = this.refs.nameInput.getDOMNode();
      input.select();
      setMode("meta");
      this.setState({ showForm: true });
    }

    // We are hiding the form
    if (prevProps.shouldFocus && !this.props.shouldFocus) {
      setMode("nav");
      this.setState({ showForm: false });
    }
  },

  getInitialState() {
    return {
      inputValue: this.props.username, // NOT a react anti-pattern; this only needs to be sync'd at first
      showForm: false,
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

  getStyles() {
    return extend({}, this.getDisplay());
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

  getTransitionClassName() {
    if (!this.state.showForm) {
      return "collaborators-name-change-form-wrap-hidden";
    }
    return "";
  },

  render() {
    let inputValue = this.state.inputValue;
    let styles = this.getStyles();
    let transitionClass = this.getTransitionClassName();

    return (
      <div>
        <ModalBackground handleClick={this.props.exitModal} isHidden={this.props.isHidden} />
        <div className={"collaborators-name-change-form-wrap " + transitionClass}
          style={styles}>
          <form className="collaborators-name-change-form"
            onSubmit={this.onSubmit}>
            <p>
              What's your name?
            </p>
            <input className="js-user-name-input" type="text" ref="nameInput" value={inputValue} 
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
    return {
      isEditingName: false,
    }
  },

  handleClick() {
    if (this.props.isEditable) {
      this.setState({ isEditingName: true });
    }
  },

  handleNameChange(name) {
    let oldName = this.state.name;

    this.setState({
      isEditingName: false,
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
    let name = this.props.peer.name || this.props.peer.session;

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
    let avatars = this.props.peers.map((peer, index) => {
      return (
        <Collaborator peer={peer} isEditable={index === 0} />
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
