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

    shouldShowCollaborators() {
        const path = window.location.pathname
        const isLandingPage =  path === "/";
        const isUpload = (path.indexOf("upload") !== -1);
        return !isLandingPage && !isUpload;
    },

    render() {
        let styles = this.getStyles();
        return (
            <div className="livebook-nav" style={styles}>
                <Collaborators 
                    show={this.shouldShowCollaborators()} 
                    peers={this.props.peers} />
                <Menu render={this.props.render} />
            </div>
        );
    },
});

module.exports = Nav;