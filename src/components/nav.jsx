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
                <Menu store={this.props.store} render={this.props.render} fork={this.props.fork} />
            </div>
        );
    },
});

module.exports = Nav;
