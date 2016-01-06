var $      = require("jquery");
var React  = require("react");
var VelocityComponent = require('velocity-react').VelocityComponent;

var extend = $.extend;
var cradle = require("../cradle");

var Avatar = React.createClass({
  componentDidMount() {
    let avatarElement = this.refs.avatarSVG;
    avatarElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    avatarElement.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    avatarElement.setAttribute("enable-background", "new -255 347 100 100");
  },

  render() {
    return (
      <svg 
        className="livebook-avatar"
        ref="avatarSVG" 
        height="40" width="40" 
        version="1.1" x="0px" y="0px" 
        viewBox="-255 347 100 100" 
        xmlSpace="preserve">
          <path fill={this.props.color} d="M-205,352c-24.9,0-45,20.1-45,45c0,24.9,20.1,45,45,45c24.9,0,45-20.1,45-45C-160,372.1-180.1,352-205,352z M-231,424.4  c1.8-0.8,3.6-1.4,5.5-1.9c5.2-1.2,8.3-2.9,9.3-5.1c0.8-1.7,0.3-4-1.2-6.9c-9.6-17.7-7.9-27.7-4.8-32.9c3.1-5.3,9.1-8.2,16.7-8.2  c7.6,0,13.5,2.9,16.6,8.1c3.1,5.2,4.8,15.2-4.7,33c-1.6,3-2,5.3-1.2,7c1,2.1,4.1,3.8,9.3,5c1.8,0.4,4,1.1,6.3,2.1  c-6.7,6.3-15.8,10.1-25.7,10.1C-215.1,434.8-224.2,430.8-231,424.4z"></path>
      </svg>
    );
  }
});

var ModalBackground = React.createClass({
  getStyles() {
    let result = {
      background: "hsla(0, 0%, 100%, .25)",
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
      this.setState({ showForm: true });
      this.showFormAnimations();
    }

    // We are hiding the form
    if (prevProps.shouldFocus && !this.props.shouldFocus) {
      this.setState({ showForm: false });
      this.hideFormAnimations();
    }
  },

  showFormAnimations() {
    $("#notebook,#editor").addClass("blur");
    $(".observer:not(:first-of-type)").slideUp(150);
  },

  hideFormAnimations() {
    $("#notebook,#editor").removeClass("blur");
    $(".observer:not(:first-of-type)").slideDown(150);  
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
    cradle.setUserVar("name",name)
  },

  render() {

    let peer = this.props.peer;
    let name = peer.user.name || peer.session;
    let connected = (peer.connected) ? "!!" : "";
    let cursor = (peer.state.cursor == undefined) ? "?" : peer.state.cursor;

    return (
      <li className={"observer " + peer.status}
          data-user-color={this.props.color}
          onClick={this.handleClick}>

        <Avatar color={this.props.color} />

        <VelocityComponent animation={{ opacity: [1, 0], }} duration={600} runOnMount={true}>
          <span>{name}</span>
        </VelocityComponent>

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
        <Collaborator 
          key={index}
          peer={peer} 
          color={peer.state.color}
          isEditable={index === 0} />
      );
    })
    return avatars;
  },

  render() {
    let styles = this.props.show ? {} : { display: "none"};

    return (
      <div className="collaborators" style={styles}>
        <ul>
          {this.renderAvatars()}
        </ul>
      </div>
    )
  }
});


module.exports = Collaborators;
