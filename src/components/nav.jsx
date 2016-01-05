let React = require("react");

let Collaborators = require("./collaborators");
let Menu = require("./menu");

let Nav = React.createClass({

    getStyles() {
        let styles = {};
        if (this.isHidden()) styles.display = "none";
        return styles;
    },

    isHidden() {
        return window.location.pathname === "/";
    },

    render() {
        let styles = this.getStyles();
        return (
            <div className="livebook-nav" style={styles}>
                <Collaborators peers={this.props.peers} getCurrentPage={this.props.getCurrentPage} />
                <Menu notebook={this.props.notebook} />
            </div>
        );
    },
});

module.exports = Nav;