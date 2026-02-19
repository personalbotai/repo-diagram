# Repository Diagram 🖼️

Interactive, dynamic visualization of GitHub repository structure built with **Tailwind CSS** and vanilla JavaScript.

## Features

### Core Features
- **Dynamic Loading** - Fetches real repository structure from GitHub API
- **Interactive Diagram** - Click nodes to expand/collapse directories
- **Search & Filter** - Real-time search across file and folder names
- **Expand/Collapse All** - Quick controls to show/hide all contents
- **Configurable Depth** - Choose how many levels deep to display (1-4)
- **Export SVG** - Download the diagram as an SVG file
- **Live Statistics** - Shows total files, directories, lines of code, and repo size
- **Responsive Design** - Works on desktop and mobile
- **GitHub Pages Ready** - Deploy with zero configuration

### Phase 1 Enhancements (New!)
- ✅ **Smart Caching** - 5-minute cache to reduce API calls and improve performance
- ✅ **Rate Limit Handling** - Detects GitHub API rate limits and provides helpful wait times
- ✅ **Exponential Backoff** - Automatic retry with backoff on transient failures
- ✅ **Input Sanitization** - Prevents XSS attacks with strict repo format validation
- ✅ **Keyboard Navigation** - Full keyboard support (Arrow keys, Enter, Space, Escape)
- ✅ **Accessibility** - ARIA labels, proper roles, and screen reader support
- ✅ **Better Error Handling** - User-friendly error messages with retry suggestions
- ✅ **Enhanced UI** - Focus indicators, smooth scrolling, improved modal dialogs
- ✅ **Copy Path** - Click file nodes to see details and copy path to clipboard

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
   - **Export SVG** to download the diagram

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↓` / `↑` | Navigate between nodes |
| `Enter` / `Space` | Toggle directory / View file info |
| `Escape` | Collapse all directories |

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
# Clone or create repository
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
- **Vanilla JavaScript** - no frameworks needed
- **Client-side caching** using Map with 5-minute TTL
- **Rate limit awareness** via GitHub API headers

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Notes

- **Caching**: Repository data is cached for 5 minutes to reduce API calls
- **Rate Limits**: Unauthenticated GitHub API has 60 requests/hour. Caching helps avoid hitting limits.
- **Large Repos**: For repositories with >1000 files, consider using a smaller depth setting for better performance

## Future Enhancements (Phase 2+)

- 🔄 Virtual scrolling for very large repositories
- 🔄 Branch/tag comparison view
- 🔄 File type icons based on extension
- 🔄 Commit history per file
- 🔄 README preview
- 🔄 Contributors statistics
- 🔄 Language distribution chart
- 🔄 Clone/download button
- 🔄 Multiple layout options (dendrogram, radial, mindmap)
- 🔄 Offline mode with service worker

## Contributing

Feel free to open issues or submit PRs. All contributions are welcome!

## License

MIT

## Credits

Built with ❤️ using Tailwind CSS and the GitHub API.