# Repository Diagram 🖼️

Interactive, dynamic visualization of GitHub repository structure built with **Tailwind CSS** and vanilla JavaScript.

## Features

### Core Features
- **Dynamic Loading** - Fetches real repository structure from GitHub API
- **Interactive Diagram** - Click nodes to expand/collapse directories
- **Search & Filter** - Real-time search across file and folder names
- **Expand/Collapse All** - Quick controls to show/hide all contents
- **Configurable Depth** - Choose how many levels deep to display (1-4)
- **Multiple Layouts** - Tree, Horizontal, and Radial layout options
- **Export SVG/PNG** - Download the diagram as SVG or PNG
- **Export PDF** - Print-friendly PDF export (via jsPDF)
- **Live Statistics** - Shows total files, directories, lines of code, and repo size
- **Responsive Design** - Works on desktop and mobile
- **GitHub Pages Ready** - Deploy with zero configuration

### All Enhancements (Complete!)
- ✅ **Smart Caching** - 5-minute cache to reduce API calls
- ✅ **Rate Limit Handling** - Detects GitHub API rate limits
- ✅ **Exponential Backoff** - Automatic retry on failures
- ✅ **Input Sanitization** - Prevents XSS attacks
- ✅ **Keyboard Navigation** - Arrow keys, Enter, Space, Escape
- ✅ **Accessibility (WCAG 2.1 AA)** - ARIA labels, focus states, high contrast, reduced motion
- ✅ **Better Error Handling** - User-friendly messages
- ✅ **Copy Path** - View file details and copy path
- ✅ **Full Responsive Design** - Mobile-first (480px, 768px, 1024px breakpoints)
- ✅ **Touch-Friendly** - Optimized for mobile devices
- ✅ **Glassmorphism Design** - Modern glass effect with backdrop blur
- ✅ **Smooth Animations** - Staggered entrance, hover effects
- ✅ **Dark Mode** - Enhanced with glass effect support
- ✅ **Zoom & Pan Controls** - Mouse wheel, drag, buttons, reset
- ✅ **Mermaid Editor** - CodeMirror with syntax highlighting
- ✅ **Mermaid Templates** - Quick inserts for all diagram types
- ✅ **Mermaid Export** - Download .mmd or PNG
- ✅ **Print Styles** - B&W output, page break controls

## Project Status

**ALL PHASES COMPLETE** ✅

- **Phase 1** (Infrastructure): Tabbed interface, zoom/pan, Mermaid editor
- **Phase 2** (UI/UX): Glassmorphism, responsive design, animations
- **Phase 3** (Polish): Accessibility, documentation, print styles, PDF export

**Production Ready** - Deploy to GitHub Pages or any static host.

## Usage

1. Enter a GitHub repository in the format `owner/repo` (e.g., `personalbotai/repo-diagram`)
2. Click **Load** or press Enter
3. Interact with the diagram:
   - **Click folders** to expand/collapse
   - Use **Expand All** / **Collapse All** buttons
   - **Type in the search box** to filter nodes
   - **Adjust depth** using the dropdown (1-4 levels)
   - **Click files** to view details and copy path
   - Use **keyboard**: Arrow keys to navigate, Enter/Space to toggle, Escape to collapse all
   - **Export**: SVG, PNG, or PDF

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↓` / `↑` | Navigate between nodes |
| `Enter` / `Space` | Toggle directory / View file info |
| `Escape` | Collapse all directories |
| `Ctrl/Cmd + Enter` | Render Mermaid diagram (in editor) |

## Accessibility

- **Full keyboard navigation** - Navigate and interact without a mouse
- **ARIA labels and roles** - Screen reader support for tree structure
- **Focus indicators** - Clear visual focus states for all interactive elements
- **High contrast mode** support via `@media (prefers-contrast: high)`
- **Reduced motion** support for users with motion sensitivity
- **Semantic HTML** - Proper heading hierarchy and landmark roles
- **Color contrast** - Meets WCAG AA standards

## Browser Support

Tested and working on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note**: Some older browsers may not support CSS features like `backdrop-filter` (glassmorphism). The UI gracefully degrades to solid backgrounds.

## Performance Notes

- **Caching**: Repository data is cached for 5 minutes to reduce API calls
- **Rate Limits**: Unauthenticated GitHub API has 60 requests/hour. Caching helps avoid hitting limits.
- **Large Repos**: For repositories with >1000 files, consider using a smaller depth setting for better performance
- **Optimizations**: Debounced search, map-based node lookup, efficient DOM updates

## Deployment to GitHub Pages

### Option 1: Automatic (Recommended)

1. Push this code to a GitHub repository named `repo-diagram` under your account
2. Go to repository **Settings** → **Pages**
3. Set **Source** to `Deploy from a branch`
4. Select branch `main` (or `master`) and folder `/ (root)`
5. Click **Save**
6. Your site will be available at `https://<username>.github.io/repo-diagram/`

### Option 2: Manual

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/repo-diagram.git
git push -u origin main
```

Then follow the Pages settings as above.

## Technical Details

- **No build step required** - Pure HTML/CSS/JS
- **Tailwind CSS** via CDN
- **GitHub REST API** for repository data
- **SVG** for connections and export
- **Vanilla JavaScript** - No frameworks
- **Client-side caching** using Map with 5-minute TTL
- **Rate limit awareness** via GitHub API headers

## License

MIT

## Credits

Built with ❤️ using Tailwind CSS and the GitHub API.