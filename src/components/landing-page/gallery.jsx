let React = require("react");

let GalleryItem = require("./gallery-item");

let Quakes = require("./gallery-item-quakes");
let Waldo = require("./gallery-item-waldo");

let FoodTruck = require("./gallery-item-food-truck");
let Starter = require("./gallery-item-starter");

let Gallery = React.createClass({
  render() {
    // FIXME - FoodTruck and Starter don't do anything onClick
    return (
      <section className="layout-container gallery-container">
        <h2> Notebook Gallery </h2>
        <p><i> NOTE: Try using the "3d card" effect </i></p>
        <Quakes clickHandler={this.props.clickHandler} />
        <Waldo clickHandler={this.props.clickHandler} />
        <FoodTruck clickHandler={this.props.clickHandler} />
        <Starter clickHandler={() => {}} /> 
      </section>
    );
  },
})

module.exports = Gallery;