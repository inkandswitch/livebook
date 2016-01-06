let React = require("react");

let Collaborators = require("./collaborators");
let Menu = require("./menu");

let Nav = React.createClass({
    shouldShowCollaborators() {
        const path = window.location.pathname
        const isLandingPage =  path === "/";
        const isUpload = (path.indexOf("upload") !== -1);
        return !isLandingPage && !isUpload;
    },

    render() {
        return (
            <div className="livebook-nav">
                <Collaborators 
                    show={this.shouldShowCollaborators()} 
                    peers={this.props.peers} />
                <Menu render={this.props.render} />
            </div>
        );
    },
});

module.exports = Nav;