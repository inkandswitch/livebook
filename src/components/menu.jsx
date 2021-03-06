const React = require("react");

const {docToIPy} = require("../ipython-converter.jsx");

const GalleryItem = React.createClass({
  render() {
    return (
      <article className="sample-notebook-forkable">
        <a href={"/fork/" + this.props.notebook}>{this.props.children}</a>
      </article>
    );
  },
});


const MonteCarlo = () => ({
  render() {
    return (
      <GalleryItem notebook="montecarlo">
        Monte Carlo simulation
      </GalleryItem>
    );
  },
});

const Quakes = () => ({
  render() {
    return (
      <GalleryItem notebook="earthquakes">
        Earthquakes in the midwest
      </GalleryItem>
    );
  },
});

const Iris = () => ({
  render() {
    return (
      <GalleryItem notebook="iris_data">
        Computer, Meet Flowers
      </GalleryItem>
    );
  },
});

const Welcome = () => ({
  render() {
    return (
      <GalleryItem notebook="welcome">
        Welcome notebook
      </GalleryItem>
    );
  },
});

const Menu = React.createClass({

  componentWillMount() {
    this.addMenuColorStyle();
  },

  componentDidUpdate() {
    this.updateMenuColorStyle();
  },

  componentWillUnmount() {
    this.removeMenuColorStyle();
  },

  addMenuColorStyle() {
    const head = document.head;
    const style = document.createElement("style");
    style.id = this.getStyleId();
    style.innerHTML = this.getStyleRule();
    head.appendChild(style);
  },

  updateMenuColorStyle() {
    const style = this.getStyle();
    if (style) debugger;
    style.innerHTML = this.getStyleRule();
  },

  removeMenuColorStyle() {
    const style = this.getStyle();
    style && style.remove();
  },

  getStyle() {
    return document.querySelector("#" + this.getStyleId());
  },

  getStyleId() {
    return "livebook-nav-menu-colors";
  },

  getStyleRule() {
    const color = this.props.getColor && this.props.getColor();
    const rules = `
      .menu-content-item:hover,
      .menu-content-item:hover a {
          background: ${color};
      }
    `;
    return rules;
  },

  componentWillUnmount() {

  },

  componentDidUpdate() {

  },

  mixins: [
    require('react-onclickoutside')
  ],

  handleClickOutside() {
    if (this.state.active) {
      this.setState({ active: false });
    }
  },

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
    let doc = docToIPy(this.doc()) // ipython format
    //let doc = this.doc()  // native format
    document.getElementById("downloader").setAttribute('href','data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc,null,2)))
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
        <ul className="menu-content">
          <li className="menu-content-header">
            Livebook
          </li>
          <li className="menu-content-item">
            <a id="downloader" onClick={this.downloadPayload} id="downloader" download="notebook.ipynb">
              <i className="fa fa-cloud-download menu-content-item-icon" />
              &nbsp;
              Download this notebook
            </a>
          </li>
          <li className="menu-content-item">
            <i className="fa fa-code-fork menu-content-item-icon"/>
            &nbsp;
            Fork a sample notebook
            <ul className="sub-menu-content">
              <li className="sub-menu-content-item">
                <Quakes />
              </li>
              <li className="sub-menu-content-item">
                <MonteCarlo />
              </li>
              <li className="sub-menu-content-item">
                <Iris />
              </li>
              <li className="sub-menu-content-item">
                <Welcome />
              </li>
            </ul>
          </li>
          <li className="menu-content-item">
            <a href="/upload">
              <i className="fa fa-upload menu-content-item-icon" />
              &nbsp;
              Upload .ipynb + .csv
            </a>
          </li>
          <li className="menu-content-item">
            <a href="//github.com/inkandswitch/livebook">
              <i className="fa fa-github menu-content-item-icon"/>
              &nbsp;
              Readme &amp; sourcecode
            </a>
          </li>
        </ul>
        <img className="livebook-hamburger" src="/menu.png" alt="menu" onClick={this.handleClick} />
      </div>
    )
  },
});

module.exports = Menu;
