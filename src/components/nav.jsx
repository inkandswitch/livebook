const React = require("react");

const Collaborators = require("./collaborators");
const Menu = require("./menu");

const Nav = () => ({
    isHidden() {
        const path = window.location.pathname
        const isLandingPage = path === "/";
        const isUpload = (path.indexOf("upload") !== -1);
        return isLandingPage || isUpload;
    },

    render() {
        const styles = this.isHidden() ? { display: "none" } : {};
        return (
            <div style={styles} className="livebook-nav">
                <Collaborators peers={this.props.peers} avatarPosition={this.props.avatarPosition} />
                <Menu render={this.props.render} />
            </div>
        );
    },
});

module.exports = Nav;