function clickForTooltip(d, element) {
  // Stop delegation so that we don't enter "edit mode" for the container Cell
  let event = d3.event;
  event.stopPropagation();
  event.preventDefault();

  /* TODO */
  // [x] Freeze position of tooltip on click (using a hacky, ad hoc replacement for the tooltip position function)
  // [ ] Try stopping the "mousemove" event somehow... (disable data_onmouseover?)
  //

  let chart = this;
  let internalAPI = this.internal.api;
  let internalConfig = this.internal.config;

  let isTooltipHidden = !internalConfig.tooltip_show;
  
  if (isTooltipHidden) {
    internalConfig.tooltip_show = true;

    this.tooltip.show({
      data: d,
      mouse: d3.mouse(element),
    });

    freezeTooltipPosition(getCurrentTooltipPosition());
  }
  else {
    internalConfig.tooltip_show = false;

    unfreezeTooltipPosition();
    this.tooltip.hide();
  }

  function getCurrentTooltipPosition() {
    // TODO
    let {tooltip} = chart.internal;
    let top = pxToInt(tooltip.style("top"));
    let left = pxToInt(tooltip.style("left"));
    return {
      top: top,
      left: left,
    };
  }

  function freezeTooltipPosition(position) {
    internalConfig.tooltip_position = function() {
      return position;
    }
  }

  function unfreezeTooltipPosition() {
    internalConfig.tooltip_position = null; // c3 thus switches us back to usings its default tooltip position function
  }

  function pxToInt(pixelString) {
    return parseInt(pixelString.replace("px", ""), 10);
  }


  /******* BEGIN C3 INTERNAL MOUSEOVER FUNCTION *******/ 
  // var $$ = this.internal,
  //     d3 = $$.d3,
  //     config = $$.config,
  //     CLASS = $$.CLASS 

  // var index = d.index;

  // if ($$.dragging || $$.flowing) { return; } // do nothing while dragging/flowing
  // if ($$.hasArcType()) { return; }

  // // Expand shapes for selection
  // if (config.point_focus_expand_enabled) { $$.expandCircles(index, null, true); }
  // $$.expandBars(index, null, true);

  // // Call event handler
  // $$.main.selectAll('.' + CLASS.shape + '-' + index).each(function (d) {
  //     config.data_onmouseover.call($$.api, d);
  // });
  /******* END INTERNAL MOUSEOVER *******/ 
}


module.exports = clickForTooltip;