const React = require("react");
const GalleryItem = require("./landing-page/gallery-item");

const {docToIPy} = require("../ipython-converter.jsx");

const MonteCarlo = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/montecarlo.csv" 
          ipynbURL="/forkable/montecarlo.ipynb" 
          fork={this.props.fork}>
        Monte Carlo simulation
      </GalleryItem>
    );
  },
});

const Quakes = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/earthquake_states_lite.csv" 
          ipynbURL="/forkable/earthquakes.ipynb" 
          fork={this.props.fork}>
        Earthquakes in the midwest
      </GalleryItem>
    );
  },
});

const Welcome = () => ({
  render() {
    return (
      <GalleryItem csvURL="/forkable/welcome.csv" 
          ipynbURL="/forkable/welcome.ipynb" 
          fork={this.props.fork}>
        Welcome notebook
      </GalleryItem>
    );
  },
});

const Menu = React.createClass({

  getInitialState() {
    return {
      active: false,
      download: false,
    };
  },

  handleDownload(event) {
    this.setState({download: true});
  },

  handleClick(event) {
    this.setState({active: !this.state.active});
  },

  doc() {
    return this.props.store.getState().doc
  },

  downloadPayload() {
    document.getElementById("downloader").setAttribute('href','data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(docToIPy(this.doc()),null,2)))
    return true
  },

  handleUpload(event) {
    this.setState({active: false});
    window.history.pushState({}, "Upload", "/upload");
    this.props.render();
  },

  render() {
    let activeClass = this.state.active ? "active" : "";
    return (
      <div className={"menu " + activeClass}>
        <img src="/menu.png" alt="menu" onClick={this.handleClick} />
        <ul className="menu-content">
          <li className="menu-content-item">
            <a id="downloader" onClick={this.downloadPayload} id="downloader" download="notebook.ipynb">
              <i className="fa fa-cloud-download" />
              &nbsp;
              Download this notebook
            </a>
          </li>
          <li className="menu-content-item">
            <i className="fa fa-code-fork"/>
            &nbsp;
            Fork a sample notebook
            <ul className="sub-menu-content">
              <li className="sub-menu-content-item">
                <Quakes fork={this.props.fork} />
              </li>
              <li className="sub-menu-content-item">
                <MonteCarlo fork={this.props.fork} />
              </li>
              <li className="sub-menu-content-item">
                <Welcome fork={this.props.fork} />
              </li>
            </ul>
          </li>
          <li className="menu-content-item">
            <a href="/upload">
              <i className="fa fa-upload" />
              &nbsp;
              Upload .ipynb + .csv
            </a>
          </li>
          <li className="menu-content-item">
            <a href="//github.com/aordlab/livebook">
              <i className="fa fa-github"/>
              &nbsp;
              Readme &amp; sourcecode
            </a>
          </li>
        </ul>
      </div>
    )
  },
});

module.exports = Menu;
