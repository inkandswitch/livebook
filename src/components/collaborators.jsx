var React = require("react");

var Collaborators = React.createClass({

  renderAvatars() {
    var peerPresence = this.props.notebook.getPeerPresence();
    // var avatars = []
    // for (var i = 0; i < peerPresence.length; i++) {
    //   var f = peerPresence[i]
    //   var klass = "observer " + f.status;
    //   // BOOTS TODO
    //   // - these elements will desire a `key` prop at some point
    //   avatars.push(<li className={klass}><span>{f.name}</span></li>)
    // }
    var avatars = peerPresence.map((f) => {
      return (
        // BOOTS TODO
        // - these elements will desire a `key` prop at some point
        <li className={"observer " + f.status}>
          <span>{f.name}</span>
        </li>
      );
    })
    return avatars
  },

  render() {
    return (
    <div className="collaborators">
      <ul>{this.renderAvatars()}</ul>
    </div>
  )}
});


module.exports = Collaborators;
