var React = require("react");

var Uploader = React.createClass({
  getInitialState() {
    return {
      isUserHovering: false,
    };
  },

  dropHandler(event) {
    this.removeHover()

    let files = event.dataTransfer.files;

    if (!areFilesValid(files)) {
      console.log("%cInvalid files.", "color: darkred;");
      return;
    }

    this.loadFilesIntoLivebook(files);

    event.stopPropagation();
    event.preventDefault();
  },

  dragOverHandler(event) {
    this.addHover();

    event.dataTransfer.dropEffect = 'copy';

    event.stopPropagation();
    event.preventDefault();
  },

  loadFilesIntoLivebook(files) {
    var _iPythonRaw;
    var _DataRaw;

    var isNotebookLoaded = false;
    var isCSVLoaded      = false;

    var startNewNotebook = this.props.startNewNotebook;

    [].forEach.call(files, readFile);

    function readFile(file) {
      let reader = new FileReader();
      reader.onload = onReaderLoad;
      reader.readAsText(file);

      function onReaderLoad(event) {
        if (isNotebook(file.name)) {
          _iPythonRaw = event.target.result;
          isNotebookLoaded = true

          document.title = file.name.slice(0, -6) + " notebook"
        }
        else {
          _DataRaw = event.target.result;
          isCSVLoaded = true
        }
        if (isNotebookLoaded && isCSVLoaded) {
          startNewNotebook({
            csv: _DataRaw,
            ipynb: _iPythonRaw,
          })
        }
      }
    }
  },

  getHoverClass() {
    return this.state.isUserHovering ? "hover" : "";
  },

  addHover() {
    this.setState({
      isUserHovering: true,
    });
  },

  removeHover() {
    this.setState({
      isUserHovering: false,
    });
  },

  render() {
    return (
      <div id="upload" className={this.getHoverClass()} 
          onDrop={this.dropHandler} onDragOver={this.dragOverHandler}>
        <h1>Drag your files here</h1>
        <ul>
          <li className="ipynb"><code>.ipynb</code> notebook</li>
          <li className="csv">CSV data</li>
        </ul>
      </div>
    );
  },
});

module.exports = Uploader;

function areFilesValid(files) {
  if (files.length !== 2) {
    alert("You must drop 2 files!")
    return false;
  }

  let filenames = [].map.call(files, (f) => f.name);

  if (!filenames.some(isNotebook)) {
    alert("One of the dropped files must have a .ipynb extension.")
    return false;
  }
  if (!filenames.some(isCSV)) {
    alert("One of the dropped files must have a .csv extension.")
    return false;
  }

  return true;
}

function isNotebook(filename) {
  return /[.]ipynb$/.test(filename)
}

function isCSV(filename) {
  return /[.]csv$/.test(filename);
}