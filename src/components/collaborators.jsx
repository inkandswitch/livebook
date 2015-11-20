var React = require("react");

var Collaborators = React.createClass({

  renderAvatars() {
    var avatars = this.props.peers.map((f) => {
      return (
        // BOOTS TODO
        // - these elements will desire a `key` prop at some point
        <li className={"observer " + f.status}>
          <span>{f.session}</span>
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
