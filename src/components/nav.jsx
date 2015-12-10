let React = require("react");

let Collaborators = require("./collaborators");
let Menu = require("./menu");

let Nav = React.createClass({

    render() {
        return (
            <div>
                <Collaborators peers={this.props.peers} setMode={this.props.setMode} getMode={this.props.getMode} getCurrentPage={this.props.getCurrentPage} />
                <Menu notebook={this.props.notebook} />
            </div>
        );
    },
});

module.exports = Nav;