# Repository Diagram 🖼️

Interactive, dynamic visualization of GitHub repository structure built with **Tailwind CSS** and vanilla JavaScript.

## Features

- **Dynamic Loading** - Fetches real repository structure from GitHub API
- **Interactive Diagram** - Click nodes to expand/collapse directories
- **Search & Filter** - Real-time search across file and folder names
- **Expand/Collapse All** - Quick controls to show/hide all contents
- **Configurable Depth** - Choose how many levels deep to display (1-4)
- **Export SVG** - Download the diagram as an SVG file
- **Live Statistics** - Shows total files, directories, lines of code, and repo size
- **Responsive Design** - Works on desktop and mobile
- **GitHub Pages Ready** - Deploy with zero configuration

## Usage

1. Enter a GitHub repository in the format `owner/repo` (e.g., `personalbotai/repo-diagram`)
2. Click **Load** or press Enter
3. Interact with the diagram:
   - Click folders to expand/collapse
   - Use **Expand All** / **Collapse All** buttons
   - Type in the search box to filter nodes
   - Adjust depth using the dropdown
   - Click **Export SVG** to download the diagram

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

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Credits

Built with ❤️ using Tailwind CSS and the GitHub API.