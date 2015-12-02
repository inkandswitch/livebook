var React = require("react");
var ReactDOM = require("react-dom");

var Menu = require("./components/menu");
var Collaborators = require("./components/collaborators-v2");
var Notebook = require("./notebook").Notebook;
// var Menu = require("./components/menu");


var cradle = require("./cradle");

// TODO - clean. this. up.
var LAST_TYPE = new Date();
var TYPING_SPAN = 500;
function typing(when) {
    return when - LAST_TYPE < TYPING_SPAN;
}

var App = React.createClass({
    componentDidMount() {

        cradle.onarrive = () => {
          this.updatePeers();
          cradle.broadcast({ cursor: this.state.cursorCell });
        };

        cradle.ondepart = this.updatePeers;

        cradle.onupdate = this.updatePeers;

        cradle.onusergram = () => {
          console.log("on usergram")
          this.updatePeers();
        };

        this.updatePeers();
    },

    handleKeyDown(event) {
        switch (event.which) {
        case 40: // down arrow
            if (this.state.mode === "meta") return;
            if (this.state.mode === "edit") return;
            this.moveCursor(1);
            event.preventDefault()
            break;
        case 38: // up arrow
            if (this.state.mode === "meta") return;
            if (this.state.mode === "edit") return;
            this.moveCursor(-1);
            event.preventDefault()
            break;
        }
    },

    handleKeyUp(event) {
        switch (event.which) {
          case 27: // esc
            if (this.state.mode === "meta") {
                return;
            }
            if (this.state.mode === "edit") {
                this.setState({ mode: "nav", });
            }
            else {
                this.setState({ mode: "view", });
            }
            break;
        }
    },

    handleKeyPress(event) {
        let mode = this.state.mode;

        if (mode === "meta") return;
        if (mode === "edit") return;

        switch (event.which) {
          case 13:  // enter
            this.setState({ mode: "edit" });
            break;
          case 107: // k
          case 113: // q
            this.moveCursor(-1);
            break;
          case 106: // j
          case 97:  // a
            this.moveCursor(1);
            break;
          case 99: // c
            this.appendCell('code');
            break;
          case 109: // m
            this.appendCell('markdown');
            break;
          case 120: // x
            this.deleteCell();
            break;
        }
    },

    appendCell() {
        throw new Error("NYI - appendCell");
    },

    deleteCell() {
        throw new Error("NYI - deleteCell");
    },

    moveCursor(delta, options) {
        options = Object.assign({}, options);

        let newCursorPosition = this.state.cursorCell + delta;
        let iPython = this.state.iPython;
        let outOfBounds = newCursorPosition >= iPython.cells.length || newCursorPosition < 0

        if (this.state.mode === "edit") return;

        if (this.state.mode === "view") {
            this.setState({ mode: "nav" });
            return;
        }

        if (outOfBounds) {
            return;
        }

        this.setState({
            cursor: newCursorPosition,
        });

        cradle.broadcast({ cursor: newCursorPosition });

        // allows us to disable auto scrolling when the user clicks between cells
        if (!options.noScroll) {
            let scrollPosition = {
                scrollTop: $('.cursor').offset().top - 80,
            };

            $('body').animate(scrollPosition);
        }
    },


    getInitialState() {
        return {
            currentPage: "notebook",
            cursorCell : 0, // current user's cursor
            dataRaw    : "",
            iPythonRaw : "",
            iPython    : { 
                cells:[],
            },
            mode       : "view",
            peers      : [],
        };
    },

    handleNameChange(name) {
        cradle.configure({
          name: name,
        });
    },

    setMode(mode) {
        this.setState({ mode: mode });
    },

    updatePeers() {
        let peers = [].concat(cradle.peers()); // keep it semi-immutable?
        let currentUser = Object.assign({}, peers[0]);
        let otherUsers = peers.slice(1) || [];
        currentUser.cursor = this.state.cursorCell;
        this.setState({ peers: [currentUser, ...otherUsers] });
    },

    render() {
        let renderTime = new Date();
        let isTyping = typing(renderTime);
        let fakeNoteBookExport = require("./notebook");
        return (
            <div onKeyUp={this.handleKeyUp} onKeyDown={this.handleKeyDown} onKeyPress={this.handleKeyPress}>
                <Notebook data={this.state.iPython} typing={isTyping} />
                <Menu notebook={fakeNoteBookExport} />
                <Collaborators peers={this.state.peers} setMode={this.setMode} handleNameChange={this.handleNameChange} />
                <div id="editor" />
            </div>
        );
    },
});

ReactDOM.render(<App />, document.getElementById("livebook-app"));
