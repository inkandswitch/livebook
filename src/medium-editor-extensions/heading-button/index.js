module.exports = modifyH2Button;

function modifyH2Button(MediumEditor) {
  MediumEditor.extensions.button.prototype.defaults.h2.contentDefault = "<b>H</b>";
  MediumEditor.extensions.button.prototype.defaults.h2.contentFA = "<i class='fa fa-header'></i>";
}