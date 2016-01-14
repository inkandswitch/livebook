const $      = require("jquery");
const React  = require("react");
const { VelocityComponent } = require('velocity-react');

const extend = $.extend;
const cradle = require("../cradle");

const Avatar = React.createClass({
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

const ModalBackground = React.createClass({
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

const CollaboratorNameForm = React.createClass({

  componentDidUpdate(prevProps, prevState) {
    // We are showing the form
    if (!prevProps.shouldFocus && this.props.shouldFocus) {
      let input = this.refs.nameInput;
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
    $(".observer:not(:first-of-type)").slideUp(150);
  },

  hideFormAnimations() {
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
    let name  = input.value;
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

const Collaborator = React.createClass({

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
    this.setState({ isEditingName: false });
    // send user name to server
    cradle.setUserVar("name",name)
  },

  hasPosition() {
    const { position } = this.props;
    return position && ("top" in position);
  },

  getPosition() {
    let result = {};
    if (!this.hasPosition()) return result; // Might be unnecessary

    const position = "absolute";
    const { top, overlaps } = this.props.position;

    result = { position, top };
    if (overlaps) {
      result = this.addOverlapOffset(result);
    }
    
    return result;
  },

  addOverlapOffset(position) {
    const avatarDim = 40;
    const overlaps = this.props.position.overlaps;
    const right = (-avatarDim * overlaps) + "px"
    return { ...position, right };
  },

  render() {

    let peer = this.props.peer;
    let session = peer.session;
    let name = peer.user.name || peer.session;
    let connected = (peer.connected) ? "!!" : "";
    let cursor = peer.state.cursor;
    let styles = { ...this.getPosition() };
    return (
      <li className={"observer " + peer.status}
          data-user-color={this.props.color}
          onClick={this.handleClick}
          style={styles}>

        <Avatar color={this.props.color} />

        <VelocityComponent animation={{ opacity: [1, 0], }} duration={600} runOnMount={true}>
          <span className="avatar-name">{name}</span>
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


const Collaborators = React.createClass({
  getPositionFromNodeId(nodeId, index) {
    const node = document.querySelector("[livebook-node-id='" + nodeId + "']");
    if (!node) return { top: 0 };
    const top = node.offsetTop;
    return { top };
  },

  getAvatarPositions() {
    const nodeIds = this.props.peers.map( p => p.state.cursor );
    const positions = nodeIds.map(this.getPositionFromNodeId);

    return this.validatePositions(positions);
  },

  validatePositions(positions) {
    // Adds `overlap` prop to position objects
    // Lets us compute horizontal offsets when rendering avatars
    let areOverlaps = false;
    const overlaps = {};
    const result = positions.map((position) => {

      const { top } = position;
//      if (!top) debugger;

      if (overlaps[top] === undefined) 
        overlaps[top] = -1;

      overlaps[top]++;

      if (overlaps[top] > 0) {
        position.overlaps = overlaps[top];
        areOverlaps = true;        
      }
      
      return position;
    });

//    if (areOverlaps) debugger;

    return result;
  },

  renderAvatars() {
    const positions = this.getAvatarPositions();
    console.log("RENDER AVATAR",positions)
    const avatars = this.props.peers.map((peer, index) => {
      const peerId = peer.session;
      const position = positions[index];
      return (
        <Collaborator 
          key={index}
          peer={peer}
          color={peer.state.color}
          position={position}
          isEditable={index === 0} />
      );
    })
    return avatars;
  },

  render() {
    return (
      <div className="collaborators">
        <ul>
          {this.renderAvatars()}
        </ul>
      </div>
    )
  }
});


module.exports = Collaborators;
