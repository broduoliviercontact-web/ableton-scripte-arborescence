# Ableton Session Mapper v1.3.0

Installable Ableton Live extension package.

Contents:

- manifest.json
- dist/extension.js
- assets/viewer-simple/styles.css
- assets/vendor/mermaid.min.js

Install in Live:

1. Open Live Settings > Extensions.
2. Drag and drop the generated .ablx file from the release folder.
3. Restart or re-enable the extension if Live requests it.
4. Right-click in Live and run "Export Session Map".

Installed mode notes:

- exports are written to the SDK storage directory, not this release folder;
- SVG/PNG Mermaid renders remain optional manual dev exports;
- HTML Report, Session Grid, External Launcher and integrated modal remain available.
