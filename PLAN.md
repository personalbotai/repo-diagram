# PLAN: Implement Export PDF Functionality

## Context
- Repository: `personalbotai-repo-diagram-1780f36`
- Problem: `exportPDF()` function is missing in `app.js` but the button exists in UI
- Current state: SVG and PNG exports work, PDF export button does nothing (or causes error)

## Goals
1. Add `exportPDF()` method to `DiagramApp` class in `app.js`
2. Ensure PDF export uses the same export bounds and dark mode support as SVG/PNG
3. Use a PDF generation library (jsPDF recommended)
4. Keep consistency with existing export flow

## Steps

### Step 1: Add jsPDF library to index.html
- Add CDN script for jsPDF before the app.js script tag
- Reason: jsPDF is a well-maintained library for PDF generation in browser

### Step 2: Implement exportPDF() method in app.js
- Location: after `exportPNG()` method (around line 1550-1600)
- Method signature: `exportPDF()`
- Logic:
  - Check if `this.repoData` and `this.exportBounds` are set
  - Show loading overlay
  - Create SVG element with same rendering logic as `exportSVG()`
  - Convert SVG to canvas (similar to PNG but for PDF)
  - Use jsPDF to create PDF and add the image
  - Trigger download
  - Handle errors and hide loading

### Step 3: Test the implementation
- Verify PDF button triggers the function
- Check PDF file downloads correctly with proper dimensions
- Ensure dark mode colors are preserved

## Dependencies
- jsPDF library (via CDN)
- Existing `calculateExportBounds()` and rendering logic

## Risks
- PDF size may be large for complex diagrams (can add quality/compression options later)
- Cross-origin issues with SVG images (but we're using inline SVG, so should be fine)

## Success Criteria
- Clicking "Export PDF" button downloads a PDF file
- PDF contains the diagram with correct colors, layout, and dimensions
- No console errors during export
