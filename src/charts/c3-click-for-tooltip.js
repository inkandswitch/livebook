function createClickForTooltip() {

  let isHackinessInitialized = false;
  let isHackinessActive = true;
  let lastClickedData;
  let showTooltip, hideTooltip;

  // So you can make things go back to normal
  clickForTooltip.toggle = function() {
    isHackinessActive = !isHackinessActive;
  };

  return clickForTooltip;

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

    if (!isHackinessInitialized) {
      disrespectOriginalTooltipConfig();
      shortCircuitDefaultTooltipFunctions();
      isHackinessInitialized = true;
    }

    if (d === lastClickedData) {
      hideTooltip.call(chart.internal);
      lastClickedData = null;
    }
    else {
      lastClickedData = d;
      showTooltip.call(chart.internal, [d], element);
    }

    function disrespectOriginalTooltipConfig() {
      // WARNING: this does not respect the original quill config (duh)
      internalConfig.tooltip_show = true;
    }

    function shortCircuitDefaultTooltipFunctions() {
      wrapShowTooltip();
      wrapHideTooltip();
    }

    function wrapShowTooltip() {
      showTooltip = chart.internal.showTooltip;
      chart.internal.showTooltip = function nuShowTooltip() {
        if (isHackinessActive) return;
        showTooltip.call(chart.internal, ...arguments);
      }
    }

    function wrapHideTooltip() {
      hideTooltip = chart.internal.hideTooltip;
      chart.internal.hideTooltip = function nuHideTooltip() {
        if (isHackinessActive) return;
        hideTooltip.call(chart.internal, ...arguments);
      }
    }
  }
}

module.exports = createClickForTooltip;