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
        return !this.props.show;
    },

    render() {
        let styles = this.getStyles();
        return (
            <div className="livebook-nav" style={styles}>
                <Collaborators peers={this.props.peers} setMode={this.props.setMode} getMode={this.props.getMode} getCurrentPage={this.props.getCurrentPage} />
                <Menu notebook={this.props.notebook} />
            </div>
        );
    },
});

module.exports = Nav;