let React = require("react");

let GalleryItem = require("./gallery-item");

let Starter = React.createClass({
    render() {
        return (
          <GalleryItem csvURL="/forkable/starter.csv" 
              ipynbURL="/forkable/starter.ipynb" 
              clickHandler={this.props.clickHandler}
              starter={true}>
              <header className="gallery-item-header">
                <div className="gallery-item-logo">
                  <img src="/img/starter.svg" />
                </div>
                <div className="gallery-item-title">
                  <h3> Starter Notebook </h3>
                  <p> by <span className="text-green"> YOU! </span> </p>
                </div>
              </header>
              <footer className="gallery-item-footer">
                <i>
                  prose • figures • tables
                </i>
              </footer>
              <figure className="gallery-item-preview">
                <img src="/img/starter-preview.png" />
              </figure>
          </GalleryItem>
        );
    },
});

module.exports = Starter;