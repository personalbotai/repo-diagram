// Main Application
class RepoDiagram {
    constructor() {
        this.repoData = null;
        this.nodes = new Map();
        this.expanded = new Set();
        this.maxDepth = 2;
        this.searchQuery = '';
        this.currentRepo = '';
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.repoInput = document.getElementById('repoInput');
        this.loadBtn = document.getElementById('loadBtn');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        this.exportSVGBtn = document.getElementById('exportSVGBtn');
        this.exportPNGBtn = document.getElementById('exportPNGBtn');
        this.searchInput = document.getElementById('searchInput');
        this.depthSelect = document.getElementById('depthSelect');
        this.diagram = document.getElementById('diagram');
        this.nodesContainer = document.getElementById('nodes');
        this.connectionsSvg = document.getElementById('connections');
        this.loading = document.getElementById('loading');
        this.status = document.getElementById('status');
        this.emptyState = document.getElementById('emptyState');
        this.statsBar = document.getElementById('statsBar');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.controlsBg = document.getElementById('controlsBg');
    }

    bindEvents() {
        this.loadBtn.addEventListener('click', () => this.loadRepo());
        this.repoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadRepo();
        });
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        this.depthSelect.addEventListener('change', (e) => {
            this.maxDepth = parseInt(e.target.value);
            this.render();
        });
        this.expandAllBtn.addEventListener('click', () => {
            if (this.repoData) {
                this.expandAll(this.repoData);
                this.render();
            }
        });
        this.collapseAllBtn.addEventListener('click', () => {
            this.expanded.clear();
            this.render();
        });
        this.exportSVGBtn.addEventListener('click', () => this.exportSVG());
        this.exportPNGBtn.addEventListener('click', () => this.exportPNG());
        this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
    }

    async loadRepo() {
        const input = this.repoInput.value.trim();
        if (!input) {
            this.showStatus('Please enter a repository', 'error');
            return;
        }

        // Parse owner/repo format
        let repo = input;
        if (input.includes('github.com/')) {
            const parts = input.split('github.com/');
            if (parts[1]) {
                repo = parts[1].replace(/\.git$/, '');
            }
        }

        if (!repo.includes('/')) {
            this.showStatus('Invalid repository format. Use "owner/repo"', 'error');
            return;
        }

        this.currentRepo = repo;
        this.showLoading(true);
        this.showStatus('', '');

        try {
            const data = await this.fetchRepoStructure(repo);
            this.repoData = data;
            this.expanded.clear();
            this.expanded.add('root');
            this.render();
            this.updateStats(data);
            this.showStatus(`Successfully loaded ${repo}`, 'success');
            this.emptyState.classList.add('hidden');
            this.statsBar.classList.remove('hidden');
        } catch (error) {
            this.showStatus(`Failed to load repository: ${error.message}`, 'error');
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchRepoStructure(repo) {
        const [owner, name] = repo.split('/');
        
        // Fetch repository tree recursively
        const response = await fetch(`https://api.github.com/repos/${owner}/${name}/git/trees/main?recursive=1`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Repository not found');
            }
            if (response.status === 403) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert flat tree to hierarchical structure
        return this.buildTree(data.tree, repo);
    }

    buildTree(flatTree, repoPath) {
        const root = {
            name: repoPath.split('/')[1],
            type: 'tree',
            path: '',
            children: [],
            size: 0,
            mode: '040000'
        };

        const nodeMap = { '': root };

        for (const item of flatTree) {
            const pathParts = item.path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const dirPath = pathParts.slice(0, -1).join('/');

            // Ensure parent exists
            if (!nodeMap[dirPath]) {
                let currentPath = '';
                for (const part of pathParts.slice(0, -1)) {
                    const parentPath = currentPath;
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    
                    if (!nodeMap[currentPath]) {
                        const parent = nodeMap[parentPath];
                        const newNode = {
                            name: part,
                            type: 'tree',
                            path: currentPath,
                            children: [],
                            size: 0,
                            mode: '040000'
                        };
                        parent.children.push(newNode);
                        nodeMap[currentPath] = newNode;
                    }
                }
            }

            const parent = nodeMap[dirPath];
            const node = {
                name: fileName,
                type: item.type === 'tree' ? 'tree' : 'blob',
                path: item.path,
                size: item.size || 0,
                mode: item.mode
            };

            if (item.type === 'blob') {
                parent.size += item.size;
            }

            parent.children.push(node);
            nodeMap[item.path] = node;
        }

        // Calculate total sizes recursively
        const calculateSize = (node) => {
            if (node.type === 'blob') return node.size;
            let total = 0;
            for (const child of node.children) {
                total += calculateSize(child);
            }
            node.size = total;
            return total;
        };
        calculateSize(root);

        return root;
    }

    render() {
        this.nodesContainer.innerHTML = '';
        this.connectionsSvg.innerHTML = '';

        if (!this.repoData) return;

        const containerWidth = this.diagram.clientWidth;
        const nodeWidth = 180;
        const verticalSpacing = 120;
        const horizontalSpacing = 40;

        // Generate nodes
        const nodeElements = new Map();
        const layout = this.calculateLayout(this.repoData, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing);

        // Draw connections first (so they appear behind nodes)
        this.drawConnections(layout, nodeElements);

        // Draw nodes
        for (const [id, node] of layout) {
            const element = this.createNodeElement(node, this.repoData);
            element.style.position = 'absolute';
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
            element.style.width = `${nodeWidth}px`;
            this.nodesContainer.appendChild(element);
            nodeElements.set(id, element);
        }
    }

    calculateLayout(root, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing) {
        const layout = new Map();
        const levelHeights = new Map();
        const levelNodes = new Map();

        // Collect nodes by level with search filter
        const collectNodes = (node, level, parentId, index) => {
            const id = node.path || 'root';
            
            // Check if node matches search
            const matchesSearch = !this.searchQuery || node.name.toLowerCase().includes(this.searchQuery);
            
            // Determine if we should show this node
            const isVisible = matchesSearch || 
                (this.expanded.has(id) && level < this.maxDepth);

            if (isVisible) {
                if (!levelNodes.has(level)) {
                    levelNodes.set(level, []);
                }
                levelNodes.get(level).push({ node, id, parentId, index });
            }

            // Recursively collect children if expanded
            if (this.expanded.has(id) && node.children && level < this.maxDepth) {
                let childIndex = 0;
                for (const child of node.children) {
                    collectNodes(child, level + 1, id, childIndex);
                    childIndex++;
                }
            }
        };

        collectNodes(root, 0, null, 0);

        // Calculate positions
        for (const [level, nodes] of levelNodes) {
            const totalWidth = nodes.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
            let startX = (containerWidth - totalWidth) / 2;
            
            for (let i = 0; i < nodes.length; i++) {
                const { node, id } = nodes[i];
                const x = startX + i * (nodeWidth + horizontalSpacing);
                const y = level * verticalSpacing + 50;
                layout.set(id, { node, x, y, level });
            }
        }

        return layout;
    }

    drawConnections(layout, nodeElements) {
        const svg = this.connectionsSvg;
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        for (const [id, { node, x, y }] of layout) {
            if (node.path && node.path !== '') {
                // Find parent
                const pathParts = node.path.split('/');
                const parentPath = pathParts.slice(0, -1).join('/');
                const parentLayout = layout.get(parentPath || 'root');
                
                if (parentLayout) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', parentLayout.x + nodeWidth / 2);
                    line.setAttribute('y1', parentLayout.y + 50);
                    line.setAttribute('x2', x + nodeWidth / 2);
                    line.setAttribute('y2', y);
                    line.setAttribute('class', 'connector');
                    svg.appendChild(line);
                }
            }
        }
    }

    createNodeElement(node, root) {
        const container = document.createElement('div');
        container.className = 'node bg-white rounded-xl shadow-md p-4 border-2';
        container.dataset.path = node.path || 'root';
        container.dataset.type = node.type;

        // Set border color based on type and level
        const level = node.path ? node.path.split('/').length : 0;
        let borderColor;
        if (node.path === '') {
            borderColor = 'border-blue-500';
        } else if (node.type === 'tree') {
            const colors = ['border-blue-300', 'border-green-300', 'border-yellow-300', 'border-purple-300', 'border-pink-300'];
            borderColor = colors[(level - 1) % colors.length];
        } else {
            borderColor = 'border-slate-300';
        }
        container.classList.add(borderColor);

        // Icon based on type
        const icon = node.type === 'tree' ? '📁' : '📄';
        const isDirectory = node.type === 'tree';

        // File count for directories
        let fileCount = '';
        if (isDirectory) {
            const fileCountValue = this.countFiles(node);
            fileCount = `<div class="text-xs text-slate-500 mt-1">${fileCountValue} items</div>`;
        }

        // Size display
        const size = node.size > 0 ? this.formatSize(node.size) : '';
        const sizeDisplay = size ? `<div class="text-xs text-slate-500">${size}</div>` : '';

        // Expand/collapse button for directories
        let expandBtn = '';
        if (isDirectory && node.children.length > 0) {
            const isExpanded = this.expanded.has(node.path || 'root');
            const chevron = isExpanded ? '▼' : '▶';
            expandBtn = `<button class="expand-btn absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-xs hover:bg-slate-50">${chevron}</button>`;
        }

        // Search highlight
        let displayName = node.name;
        if (this.searchQuery && node.name.toLowerCase().includes(this.searchQuery)) {
            const regex = new RegExp(`(${this.searchQuery})`, 'gi');
            displayName = node.name.replace(regex, '<span class="search-highlight">$1</span>');
        }

        container.innerHTML = `
            ${expandBtn}
            <div class="node-content">
                <div class="node-icon">${icon}</div>
                <div class="node-name">${displayName}</div>
                ${fileCount}
                ${sizeDisplay}
            </div>
        `;

        // Event listeners
        if (isDirectory) {
            container.addEventListener('click', (e) => {
                // Don't toggle if clicking expand button directly
                if (e.target.classList.contains('expand-btn')) {
                    e.stopPropagation();
                }
                this.toggleDirectory(node);
            });

            const expandBtnEl = container.querySelector('.expand-btn');
            if (expandBtnEl) {
                expandBtnEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDirectory(node);
                });
            }
        } else {
            container.addEventListener('click', () => {
                this.showFileInfo(node);
            });
        }

        return container;
    }

    toggleDirectory(node) {
        const path = node.path || 'root';
        if (this.expanded.has(path)) {
            this.expanded.delete(path);
        } else {
            this.expanded.add(path);
        }
        this.render();
    }

    expandAll(node) {
        this.expanded.add(node.path || 'root');
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'tree') {
                    this.expandAll(child);
                }
            }
        }
    }

    countFiles(node) {
        if (node.type === 'blob') return 1;
        let count = 0;
        for (const child of node.children) {
            count += this.countFiles(child);
        }
        return count;
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `p-4 rounded-lg mb-6 ${type ? `status-${type}` : 'hidden'}`;
        if (type) {
            this.status.classList.remove('hidden');
        } else {
            this.status.classList.add('hidden');
        }
    }

    showLoading(show) {
        this.loading.classList.toggle('hidden', !show);
        this.loadBtn.disabled = show;
    }

    updateStats(data) {
        const stats = this.collectStats(data);
        document.getElementById('totalFiles').textContent = stats.files;
        document.getElementById('totalDirs').textContent = stats.dirs;
        document.getElementById('totalLines').textContent = '~' + stats.lines.toLocaleString();
        document.getElementById('repoSize').textContent = this.formatSize(stats.size);
    }

    collectStats(node) {
        let files = 0;
        let dirs = 0;
        let lines = 0;
        let size = 0;

        const traverse = (n) => {
            if (n.type === 'blob') {
                files++;
                size += n.size;
                lines += Math.floor(n.size / 50); // rough estimate
            } else {
                dirs++;
                for (const child of n.children) {
                    traverse(child);
                }
            }
        };

        traverse(node);
        return { files, dirs, lines, size };
    }

    showFileInfo(file) {
        const info = `
File: ${file.name}
Path: ${file.path}
Size: ${this.formatSize(file.size)}
Type: ${file.type}
Mode: ${file.mode}
        `.trim();
        alert(info);
    }

    exportSVG() {
        const svg = document.getElementById('connections');
        const nodes = document.getElementById('nodes');
        
        if (!svg || !nodes) {
            this.showStatus('No diagram to export', 'error');
            return;
        }

        // Create a combined SVG
        const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSvg.setAttribute('width', this.diagram.clientWidth);
        exportSvg.setAttribute('height', this.diagram.clientHeight);
        exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Clone connections
        const clonedConnections = svg.cloneNode(true);
        exportSvg.appendChild(clonedConnections);

        // Convert HTML nodes to SVG groups (simplified)
        // In a production version, we'd convert each node to SVG elements
        // For now, we'll just export the connections

        const svgData = new XMLSerializer().serializeToString(exportSvg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentRepo.replace('/', '-')}-diagram.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('SVG exported!', 'success');
    }

    exportPNG() {
        // Simple PNG export using canvas
        const diagram = this.diagram;
        const nodes = this.nodesContainer;
        const connections = this.connectionsSvg;
        
        if (!this.repoData) {
            this.showStatus('No diagram to export', 'error');
            return;
        }

        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = diagram.clientWidth;
        const height = diagram.clientHeight;
        canvas.width = width;
        canvas.height = height;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw connections
        const connLines = connections.querySelectorAll('line');
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        connLines.forEach(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });

        // Draw nodes
        const nodeElements = nodes.querySelectorAll('.node');
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        nodeElements.forEach(node => {
            const x = parseFloat(node.style.left) + 90; // center (180/2)
            const y = parseFloat(node.style.top) + 40; // center (80/2)
            const type = node.dataset.type;
            const name = node.querySelector('.node-name').textContent;
            const rect = node.querySelector('div:first-child'); // the inner content div

            // Node background
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = type === 'tree' ? '#3b82f6' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - 90, y - 40, 180, 80, 8);
            ctx.fill();
            ctx.stroke();

            // Icon
            const icon = type === 'tree' ? '📁' : '📄';
            ctx.font = '24px sans-serif';
            ctx.fillText(icon, x, y - 15);

            // Name
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.fillText(name, x, y + 10);
        });

        // Convert to PNG and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentRepo.replace('/', '-')}-diagram.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showStatus('PNG exported!', 'success');
        }, 'image/png');
    }

    toggleDarkMode() {
        const body = document.body;
        const controls = this.controlsBg;
        const isDark = body.classList.toggle('dark');
        
        if (isDark) {
            body.classList.remove('from-slate-50', 'via-blue-50', 'to-purple-50');
            body.classList.add('from-slate-900', 'via-slate-800', 'to-slate-900');
            controls.classList.remove('bg-white');
            controls.classList.add('bg-slate-800');
            this.darkModeBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Light Mode
            `;
        } else {
            body.classList.add('from-slate-50', 'via-blue-50', 'to-purple-50');
            body.classList.remove('from-slate-900', 'via-slate-800', 'to-slate-900');
            controls.classList.add('bg-white');
            controls.classList.remove('bg-slate-800');
            this.darkModeBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
                Dark Mode
            `;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RepoDiagram();
});