
module.exports = modifyAnchorPreview;

function modifyAnchorPreview(MediumEditor) {
    const AnchorPreview = MediumEditor.extensions.anchorPreview;

    AnchorPreview.prototype.getTemplate = getTemplate;

    function getTemplate() {
        return '<div class="medium-editor-toolbar-anchor-preview" id="medium-editor-toolbar-anchor-preview">' +
            '<i class="medium-editor-toolbar-anchor-preview-helper-copy">Click below to edit</i>' +
            '    <a class="medium-editor-toolbar-anchor-preview-inner"></a>' +
            '</div>';
    }
}