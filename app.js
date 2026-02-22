// Main Application
class RepoDiagram {
    constructor() {
        this.repoData = null;
        this.nodes = new Map();
        this.expanded = new Set();
        this.maxDepth = 2;
        this.searchQuery = '';
        this.currentRepo = '';
        this.currentBranch = 'main';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimitRemaining = null;
        this.rateLimitReset = null;
        this.focusedNode = null;
        this.nodeTabIndex = 0;
        this.repoStats = null; // Store repository statistics for smart depth
        this.maxRepoDepth = 0; // Maximum depth of the repository
        
        // Zoom and Pan state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanMode = false;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Tab state
        this.currentTab = 'diagram'; // 'diagram' or 'mermaid'
        
        // Layout state
        this.currentLayout = 'tree'; // 'tree', 'horizontal', 'radial'
        
        // Export state
        this.isExporting = false;
        this.exportBounds = null;
        
        // Undo/Redo state
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        
        // Icon mapping for file extensions
        this.iconMap = {
            // Programming languages
            'js': '🟨', 'jsx': '🟨', 'ts': '🔵', 'tsx': '🔵',
            'go': '🔵', 'py': '🐍', 'java': '☕', 'rb': '💎', 'php': '🐘',
            'cs': '🔷', 'cpp': '🔶', 'c': '⚙️', 'h': '⚙️', 'swift': '🍎',
            'kt': '🎯', 'rs': '⚡', 'scala': '🔺', 'm': '📱', 'r': '📊',
            
            // Web
            'html': '🌐', 'htm': '🌐', 'css': '🎨', 'scss': '🎨', 'sass': '🎨',
            'less': '🎨', 'vue': '💚', 'svelte': '🔥', 'angular': '🅰️',
            
            // Data/Config
            'json': '📋', 'yaml': '📝', 'yml': '📝', 'toml': '📄', 'ini': '📄',
            'xml': '📄', 'csv': '📊', 'sql': '🗄️', 'graphql': '◆',
            
            // Documents
            'md': '📖', 'markdown': '📖', 'txt': '📄', 'pdf': '📕', 'doc': '📘',
            'docx': '📘', 'rtf': '📄', 'odt': '📄',
            
            // Images
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🎨',
            'webp': '🖼️', 'ico': '🖼️', 'bmp': '🖼️', 'tiff': '🖼️',
            
            // Media
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'mp4': '🎬', 'avi': '🎬',
            'mov': '🎬', 'mkv': '🎬', 'webm': '🎬', 'm4a': '🎵',
            
            // Archives
            'zip': '📦', 'tar': '📦', 'gz': '📦', 'rar': '📦', '7z': '📦',
            'bz2': '📦', 'xz': '📦',
            
            // Shell/Scripts
            'sh': '💻', 'bash': '💻', 'zsh': '💻', 'fish': '💻', 'ps1': '💻',
            'bat': '💻', 'cmd': '💻', 'ps': '💻',
            
            // Specialized
            'dockerfile': '🐳', 'makefile': '🛠️', 'cmake': '🛠️',
            'gradle': '🛠️', 'maven': '🛠️', 'npm': '📦', 'yarn': '📦',
            'pip': '🐍', 'requirements': '🐍', 'env': '🔒', 'gitignore': '🚫',
            'gitattributes': '⚙️', 'editorconfig': '⚙️', 'eslintrc': '🔍',
            'prettierrc': '💅', 'tsconfig': '🔵', 'jsconfig': '🟨',
            
            // License/Config
            'license': '⚖️', 'readme': '📖', 'contributing': '🤝',
            'changelog': '📜', 'todo': '✅', 'fixme': '🔧',
        };
        
        // Dimensions
        this.nodeWidth = 180;
        this.nodeHeight = 90; // Increased for better content fit
        
        this.initElements();
        this.bindEvents();
        this.initMermaidEditor();
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const { data, timestamp } = cached;
        const now = Date.now();
        if (now - timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return data;
    }

    setInCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    initElements() {
        this.repoInput = document.getElementById('repoInput');
        this.branchSelect = document.getElementById('branchSelect');
        this.loadBtn = document.getElementById('loadBtn');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        this.exportSVGBtn = document.getElementById('exportSVGBtn');
        this.exportPNGBtn = document.getElementById('exportPNGBtn');
        this.searchInput = document.getElementById('searchInput');
        this.depthSelect = document.getElementById('depthSelect');
        this.layoutSelect = document.getElementById('layoutSelect');
        this.diagram = document.getElementById('diagram');
        this.nodesContainer = document.getElementById('nodes');
        this.connectionsSvg = document.getElementById('connections');
        this.loading = document.getElementById('loading');
        this.status = document.getElementById('status');
        this.emptyState = document.getElementById('emptyState');
        this.statsBar = document.getElementById('statsBar');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.controlsBg = document.getElementById('controlsBg');
        
        // Tab elements
        this.tabDiagram = document.getElementById('tabDiagram');
        this.tabMermaid = document.getElementById('tabMermaid');
        this.diagramTab = document.getElementById('diagramTab');
        this.mermaidTab = document.getElementById('mermaidTab');
        
        // Zoom elements
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.zoomResetBtn = document.getElementById('zoomResetBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.panModeBtn = document.getElementById('panModeBtn');
        
        // Mermaid editor elements
        this.mermaidCode = document.getElementById('mermaidCode');
        this.mermaidPreview = document.getElementById('mermaidPreview');
        this.insertGraphBtn = document.getElementById('insertGraphBtn');
        this.insertFlowchartBtn = document.getElementById('insertFlowchartBtn');
        this.insertSequenceBtn = document.getElementById('insertSequenceBtn');
        this.insertClassBtn = document.getElementById('insertClassBtn');
        this.insertStateBtn = document.getElementById('insertStateBtn');
        this.insertGanttBtn = document.getElementById('insertGanttBtn');
        this.clearEditorBtn = document.getElementById('clearEditorBtn');
        this.exportMermaidBtn = document.getElementById('exportMermaidBtn');
        this.exportMermaidPNGBtn = document.getElementById('exportMermaidPNGBtn');
        
        // Add ARIA labels to all buttons that lack them
        document.querySelectorAll('button').forEach(btn => {
            if (!btn.hasAttribute('aria-label')) {
                const label = btn.textContent.trim() || btn.id || 'Button';
                btn.setAttribute('aria-label', label);
            }
        });
    }

    bindEvents() {
        this.loadBtn.addEventListener('click', () => this.loadRepo());
        this.repoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadRepo();
        });
        
        // Branch selection change - reload with new branch
        this.branchSelect.addEventListener('change', (e) => {
            const newBranch = e.target.value;
            if (this.currentRepo && newBranch && newBranch !== this.currentBranch) {
                this.currentBranch = newBranch;
                this.loadRepo();
            }
        });
        
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        this.depthSelect.addEventListener('change', (e) => {
            this.maxDepth = parseInt(e.target.value);
            this.render();
        });
        this.layoutSelect.addEventListener('change', (e) => {
            this.currentLayout = e.target.value;
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
        
        // PDF export button
        this.exportPDFBtn = document.getElementById('exportPDFBtn');
        if (this.exportPDFBtn) {
            this.exportPDFBtn.addEventListener('click', () => this.exportPDF());
        }
        
        // Tab navigation
        this.tabDiagram.addEventListener('click', () => this.switchTab('diagram'));
        this.tabMermaid.addEventListener('click', () => this.switchTab('mermaid'));
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom + 0.1, null));
        this.zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom - 0.1, null));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        this.panModeBtn.addEventListener('click', () => this.togglePanMode());
        
        // Pan/drag events
        this.diagram.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        window.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Mermaid editor events
        this.mermaidCode.addEventListener('input', () => this.updateMermaidPreview());
        this.insertGraphBtn.addEventListener('click', () => this.insertMermaidTemplate('graph'));
        this.insertFlowchartBtn.addEventListener('click', () => this.insertMermaidTemplate('flowchart'));
        this.insertSequenceBtn.addEventListener('click', () => this.insertMermaidTemplate('sequence'));
        this.insertClassBtn.addEventListener('click', () => this.insertMermaidTemplate('class'));
        this.insertStateBtn.addEventListener('click', () => this.insertMermaidTemplate('state'));
        this.insertGanttBtn.addEventListener('click', () => this.insertMermaidTemplate('gantt'));
        this.clearEditorBtn.addEventListener('click', () => this.clearMermaidEditor());
        this.exportMermaidBtn.addEventListener('click', () => this.exportMermaidFile());
        this.exportMermaidPNGBtn.addEventListener('click', () => this.exportMermaidPNG());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.repoData) this.render();
        });
    }

    handleKeyDown(e) {
        // Only handle keyboard navigation when diagram is loaded
        if (!this.repoData) return;
        
        const nodes = this.nodesContainer.querySelectorAll('.node');
        if (nodes.length === 0) return;
        
        // Undo/Redo shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.editor?.undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.editor?.redo();
            return;
        }
        
        // Navigation shortcuts
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextNode(nodes, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusNextNode(nodes, -1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusedNode = nodes[0];
                nodes[0].focus();
                break;
            case 'End':
                e.preventDefault();
                this.focusedNode = nodes[nodes.length - 1];
                nodes[nodes.length - 1].focus();
                break;
            case 'PageUp':
                e.preventDefault();
                const pageUpIndex = Math.max(0, this.getCurrentNodeIndex(nodes) - 10);
                this.focusedNode = nodes[pageUpIndex];
                nodes[pageUpIndex].focus();
                break;
            case 'PageDown':
                e.preventDefault();
                const pageDownIndex = Math.min(nodes.length - 1, this.getCurrentNodeIndex(nodes) + 10);
                this.focusedNode = nodes[pageDownIndex];
                nodes[pageDownIndex].focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.focusedNode) {
                    this.focusedNode.click();
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.collapseAllBtn.click();
                break;
        }
    }

    getCurrentNodeIndex(nodes) {
        if (this.focusedNode) {
            return Array.from(nodes).indexOf(this.focusedNode);
        }
        return -1;
    }

    focusNextNode(nodes, direction) {
        const currentIndex = this.focusedNode 
            ? Array.from(nodes).indexOf(this.focusedNode)
            : -1;
        
        let newIndex;
        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : nodes.length - 1;
        } else {
            newIndex = (currentIndex + direction + nodes.length) % nodes.length;
        }
        
        const newNode = nodes[newIndex];
        if (newNode) {
            newNode.focus();
            this.focusedNode = newNode;
            newNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async fetchBranches(repo) {
        const [owner, name] = repo.split('/');
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${name}/branches`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                console.warn('Failed to fetch branches:', response.status);
                return; // Don't throw - just skip branch dropdown
            }
            
            const branches = await response.json();
            const branchSelect = this.branchSelect;
            branchSelect.innerHTML = '<option value="">Auto-detect (default: main)</option>';
            
            // Add common default branches first
            const defaultBranches = ['main', 'master', 'develop', 'dev'];
            const addedBranches = new Set();
            
            // Add defaults if they exist
            for (const defBranch of defaultBranches) {
                if (branches.some(b => b.name === defBranch)) {
                    const option = document.createElement('option');
                    option.value = defBranch;
                    option.textContent = defBranch;
                    branchSelect.appendChild(option);
                    addedBranches.add(defBranch);
                }
            }
            
            // Add all other branches
            for (const branch of branches) {
                if (!addedBranches.has(branch.name)) {
                    const option = document.createElement('option');
                    option.value = branch.name;
                    option.textContent = branch.name;
                    branchSelect.appendChild(option);
                }
            }
            
            // Set current branch if it exists in the list
            if (this.currentBranch && Array.from(branchSelect.options).some(opt => opt.value === this.currentBranch)) {
                branchSelect.value = this.currentBranch;
            } else if (branches.length > 0) {
                // Select first branch that's not "Auto-detect"
                const firstRealBranch = Array.from(branchSelect.options).find(opt => opt.value && opt.value !== '');
                if (firstRealBranch) {
                    branchSelect.value = firstRealBranch.value;
                    this.currentBranch = firstRealBranch.value;
                }
            }
            
            console.log(`Loaded ${branches.length} branches for ${repo}`);
        } catch (error) {
            console.warn('Error fetching branches:', error);
        }
    }

    async loadRepo() {
        const input = this.repoInput.value.trim();
        if (!input) {
            this.showStatus('Please enter a repository', 'error');
            return;
        }

        // Parse owner/repo format and sanitize
        let repo = input;
        if (input.includes('github.com/')) {
            const parts = input.split('github.com/');
            if (parts[1]) {
                repo = parts[1].replace(/\.git$/, '');
            }
        }

        // Sanitize: only allow alphanumeric, hyphens, underscores, and slashes
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
            this.showStatus('Invalid repository format. Use "owner/repo"', 'error');
            return;
        }

        this.currentRepo = repo;
        this.showLoading(true);
        this.showStatus('', '');

        try {
            // Fetch branches and populate dropdown
            await this.fetchBranches(repo);
            
            // Get selected branch (default to main or first available)
            this.currentBranch = this.branchSelect.value || 'main';
            
            // Clear cache for this repo to avoid stale data
            this.cache.delete(repo);
            
            const data = await this.fetchRepoStructure(repo);
            this.repoData = data;
            this.expanded.clear();
            this.expanded.add('root');
            this.render();
            this.updateStats(data);
            this.showStatus(`Successfully loaded ${repo} (branch: ${this.currentBranch})`, 'success');
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
        // Check cache first
        const cached = this.getFromCache(repo);
        if (cached) {
            console.log('Loading from cache:', repo);
            return cached;
        }

        const [owner, name] = repo.split('/');
        
        // Check rate limit before making request
        if (this.rateLimitRemaining === 0 && this.rateLimitReset) {
            const now = Date.now();
            const resetTime = this.rateLimitReset * 1000;
            if (now < resetTime) {
                const waitSeconds = Math.ceil((resetTime - now) / 1000);
                throw new Error(`Rate limit exceeded. Please wait ${waitSeconds} seconds or use a GitHub token.`);
            }
        }

        // Try with exponential backoff
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await this.makeGitHubRequest(owner, name);
                const data = await response.json();
                
                // Update rate limit info
                this.updateRateLimitInfo(response);
                
                // Convert flat tree to hierarchical structure
                const treeData = this.buildTree(data.tree, repo);
                
                // Cache the result
                this.setInCache(repo, treeData);
                
                return treeData;
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx except rate limit)
                if (error.status && error.status >= 400 && error.status < 500 && error.status !== 403) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < 2) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    async makeGitHubRequest(owner, name) {
        const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${this.currentBranch}?recursive=1`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = new Error(`GitHub API error: ${response.status}`);
            error.status = response.status;
            
            // Parse error message from response
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    error.message = errorData.message;
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
            
            throw error;
        }

        return response;
    }

    updateRateLimitInfo(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining !== null) {
            this.rateLimitRemaining = parseInt(remaining, 10);
        }
        if (reset !== null) {
            this.rateLimitReset = parseInt(reset, 10);
        }
    }

    buildTree(treeData, repo) {
        // Create root node
        const root = {
            name: repo,
            type: 'tree',
            path: '',
            children: [],
            size: 0,
            mode: '040000'
        };
        
        const nodeMap = { '': root };
        
        // Sort tree items: directories first, then files, both alphabetically
        const sortedItems = [...treeData].sort((a, b) => {
            // Directories (trees) come before files (blobs)
            if (a.type !== b.type) {
                return a.type === 'tree' ? -1 : 1;
            }
            // Alphabetical within same type
            return a.path.localeCompare(b.path);
        });
        
        for (const item of sortedItems) {
            const path = item.path;
            const parts = path.split('/');
            const fileName = parts[parts.length - 1];
            const dirPath = parts.slice(0, -1).join('/');
            
            // Ensure all parent directories exist
            let currentPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (!nodeMap[currentPath]) {
                    const parent = nodeMap[parentPath];
                    // Ensure parent has children array
                    if (!parent.children) {
                        parent.children = [];
                    }
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

            const parent = nodeMap[dirPath];
            // Ensure parent has children array
            if (!parent.children) {
                parent.children = [];
            }
            
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
            if (node.children) {
                for (const child of node.children) {
                    total += calculateSize(child);
                }
            }
            node.size = total;
            return total;
        };
        calculateSize(root);

        return root;
    }

    render() {
        // Save undo state before rendering
        this.saveUndoState();
        
        this.nodesContainer.innerHTML = '';
        this.connectionsSvg.innerHTML = '';

        if (!this.repoData) return;

        const containerWidth = this.diagram.clientWidth;
        const nodeWidth = this.nodeWidth;
        const verticalSpacing = 120;
        const horizontalSpacing = 40;

        // Generate nodes
        const nodeElements = new Map();
        const layout = this.calculateLayout(this.repoData, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing);

        // Draw connections first (so they appear behind nodes)
        this.drawConnections(layout, nodeElements, nodeWidth);

        // Draw nodes
        for (const [id, layoutNode] of layout) {
            try {
                // layoutNode contains { node: actualNode, x, y, level }
                const element = this.createNodeElement(layoutNode.node, this.repoData);
                element.style.position = 'absolute';
                element.style.left = `${layoutNode.x}px`;
                element.style.top = `${layoutNode.y}px`;
                element.style.width = `${nodeWidth}px`;
                this.nodesContainer.appendChild(element);
                nodeElements.set(id, element);
            } catch (error) {
                console.error('Error creating node:', error, layoutNode);
            }
        }
        
        // Calculate bounds for export viewBox (including all nodes)
        this.calculateExportBounds(layout, nodeWidth);
        
        // Apply current zoom/pan transform to single group
        this.applyTransform();
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

        // Calculate positions based on layout type
        switch (this.currentLayout) {
            case 'horizontal':
                this.calculateHorizontalLayout(layout, levelNodes, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing);
                break;
            case 'radial':
                this.calculateRadialLayout(layout, levelNodes, root, containerWidth, nodeWidth);
                break;
            case 'tree':
            default:
                this.calculateTreeLayout(layout, levelNodes, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing);
                break;
        }

        return layout;
    }

    calculateTreeLayout(layout, levelNodes, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing) {
        // Original tree layout (vertical)
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
    }

    calculateHorizontalLayout(layout, levelNodes, containerWidth, nodeWidth, verticalSpacing, horizontalSpacing) {
        // Horizontal layout: root on left, children expand to the right
        const levelHeight = 100; // Fixed height for each level
        
        for (const [level, nodes] of levelNodes) {
            const totalHeight = nodes.length * (levelHeight + verticalSpacing) - verticalSpacing;
            let startY = (containerWidth - totalHeight) / 2; // Use containerWidth as approximation for height
            
            for (let i = 0; i < nodes.length; i++) {
                const { node, id } = nodes[i];
                const x = level * (nodeWidth + horizontalSpacing) + 50;
                const y = startY + i * (levelHeight + verticalSpacing);
                layout.set(id, { node, x, y, level });
            }
        }
    }

    calculateRadialLayout(layout, levelNodes, root, containerWidth, nodeWidth) {
        // Radial layout: root at center, children radiate outward
        const centerX = containerWidth / 2;
        const centerY = 400; // Fixed center Y (can be made dynamic)
        const maxRadius = Math.min(containerWidth, 800) / 2 - 100;
        
        // Get max depth
        let maxDepth = 0;
        for (const [level] of levelNodes) {
            maxDepth = Math.max(maxDepth, level);
        }
        if (maxDepth === 0) maxDepth = 1;

        for (const [level, nodes] of levelNodes) {
            const radius = (level / maxDepth) * maxRadius;
            const angleStep = (2 * Math.PI) / nodes.length;
            
            for (let i = 0; i < nodes.length; i++) {
                const { node, id } = nodes[i];
                const angle = i * angleStep - Math.PI / 2; // Start from top
                const x = centerX + radius * Math.cos(angle) - nodeWidth / 2;
                const y = centerY + radius * Math.sin(angle) - 40; // Adjust for node height
                layout.set(id, { node, x, y, level });
            }
        }
    }

    drawConnections(layout, nodeElements, nodeWidth) {
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
                    line.setAttribute('y1', parentLayout.y + this.nodeHeight);
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
        container.className = 'node glass rounded-xl shadow-md p-4 border-2';
        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'treeitem');
        container.setAttribute('aria-label', `${node.type === 'tree' ? 'Folder' : 'File'}: ${node.name || 'Unknown'}`);
        container.setAttribute('aria-expanded', node.type === 'tree' ? (this.expanded.has(node.path || 'root') ? 'true' : 'false') : 'null');
        container.dataset.path = node.path || 'root';
        container.dataset.type = node.type || 'blob';
        
        // Add level attribute for staggered animations
        const level = node.path ? node.path.split('/').length : 0;
        container.dataset.level = level;

        // Set border color based on type and level
        let borderColor;
        if (node.path === '' || node.path === 'root') {
            borderColor = 'border-blue-500';
        } else if (node.type === 'tree') {
            const colors = ['border-blue-300', 'border-green-300', 'border-yellow-300', 'border-purple-300', 'border-pink-300'];
            borderColor = colors[(level - 1) % colors.length];
        } else {
            borderColor = 'border-slate-300';
        }
        container.classList.add(borderColor);

        // Icon based on type and file extension
        const icon = this.getFileIcon(node);
        const isDirectory = node.type === 'tree';

        // File count for directories
        let fileCount = '';
        if (isDirectory && node.children) {
            const fileCountValue = this.countFiles(node);
            fileCount = `<div class="text-xs text-slate-500 mt-1">${fileCountValue} items</div>`;
        }

        // Size display
        const size = (node.size || 0) > 0 ? this.formatSize(node.size) : '';
        const sizeDisplay = size ? `<div class="text-xs text-slate-500">${size}</div>` : '';

        // Expand/collapse button for directories
        let expandBtn = '';
        if (isDirectory && node.children && node.children.length > 0) {
            const isExpanded = this.expanded.has(node.path || 'root');
            const chevron = isExpanded ? '▼' : '▶';
            expandBtn = `<button class="expand-btn absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-xs hover:bg-slate-50">${chevron}</button>`;
        }

        // Search highlight
        let displayName = node.name || 'Unknown';
        if (this.searchQuery && node.name && node.name.toLowerCase().includes(this.searchQuery)) {
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

        // Focus event for keyboard navigation
        container.addEventListener('focus', () => {
            this.focusedNode = container;
            container.classList.add('ring-2', 'ring-blue-500');
        });

        container.addEventListener('blur', () => {
            container.classList.remove('ring-2', 'ring-blue-500');
        });

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

    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1] : '';
    }

    getFileIcon(node) {
        if (node.type === 'tree') return '📁';
        const ext = this.getFileExtension(node.name).toLowerCase();
        return this.iconMap[ext] || '📄';
    }

    getIconForFilename(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        return this.iconMap[ext] || '📄';
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
        this.repoStats = stats;
        document.getElementById('totalFiles').textContent = stats.files;
        document.getElementById('totalDirs').textContent = stats.dirs;
        document.getElementById('totalLines').textContent = '~' + stats.lines.toLocaleString();
        document.getElementById('repoSize').textContent = this.formatSize(stats.size);
        
        // Calculate maximum depth of repository
        this.calculateRepoDepth(data);
        
        // Update depth select options based on repository depth
        this.updateDepthOptions();
    }

    calculateRepoDepth(node) {
        if (!node || !node.children || node.children.length === 0) {
            return 0;
        }
        
        let maxChildDepth = 0;
        for (const child of node.children) {
            const childDepth = this.calculateRepoDepth(child);
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
        
        return 1 + maxChildDepth;
    }

    updateDepthOptions() {
        const depthSelect = this.depthSelect;
        if (!depthSelect) return;
        
        // Store current value
        const currentValue = depthSelect.value;
        
        // Clear existing options
        depthSelect.innerHTML = '';
        
        // Always create options 1-5
        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = i.toString();
            depthSelect.appendChild(option);
        }
        
        // Restore previous selection if still valid (1-5)
        if (currentValue && parseInt(currentValue) >= 1 && parseInt(currentValue) <= 5) {
            depthSelect.value = currentValue;
        } else {
            // Auto-select smart depth based on repository size
            const smartDepth = this.calculateSmartDepth();
            // Ensure smartDepth is within 1-5 range
            const clampedSmartDepth = Math.max(1, Math.min(5, smartDepth));
            depthSelect.value = clampedSmartDepth;
            this.maxDepth = clampedSmartDepth;
        }
        
        console.log(`Depth options: 1-5, Selected: ${this.maxDepth}`);
    }

    calculateSmartDepth() {
        if (!this.repoStats) return 2;
        
        const { files, dirs } = this.repoStats;
        const totalEntries = files + dirs;
        
        // Smart depth algorithm based on repository size (1-5 range)
        if (totalEntries < 100) {
            return 4; // Small repo: show deeper structure
        } else if (totalEntries < 500) {
            return 3; // Medium repo: depth 3
        } else if (totalEntries < 2000) {
            return 2; // Large repo: depth 2
        } else {
            return 1; // Very large repo: depth 1 only
        }
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
        // Create or reuse modal
        let modal = document.getElementById('fileInfoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'fileInfoModal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-slate-800">File Information</h3>
                        <button id="closeModal" class="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
                    </div>
                    <div id="modalContent" class="text-slate-700"></div>
                    <div class="mt-6 flex justify-end">
                        <button id="copyPath" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-2">Copy Path</button>
                        <button id="closeModalBtn" class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Event listeners (set once)
            modal.querySelector('#closeModal').addEventListener('click', () => this.hideModal());
            modal.querySelector('#closeModalBtn').addEventListener('click', () => this.hideModal());
            modal.querySelector('#copyPath').addEventListener('click', () => {
                const currentPath = modal.dataset.currentPath;
                if (currentPath) {
                    this.copyPathToClipboard(currentPath);
                }
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }
        
        // Store current file path in modal dataset for copy functionality
        modal.dataset.currentPath = file.path || '';
        
        // Update modal content with fallbacks for undefined values
        const content = modal.querySelector('#modalContent');
        content.innerHTML = `
            <div class="space-y-3">
                <div><strong>Name:</strong> <span class="font-mono">${this.escapeHtml(file.name || 'Unknown')}</span></div>
                <div><strong>Path:</strong> <span class="font-mono text-sm break-all">${this.escapeHtml(file.path || 'N/A')}</span></div>
                <div><strong>Size:</strong> ${file.size !== undefined ? this.formatSize(file.size) : 'N/A'}</div>
                <div><strong>Type:</strong> ${file.type === 'tree' ? '📁 Directory' : '📄 File'}</div>
                <div><strong>Mode:</strong> <span class="font-mono text-sm">${file.mode || 'N/A'}</span></div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    hideModal() {
        const modal = document.getElementById('fileInfoModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    copyPathToClipboard(path) {
        navigator.clipboard.writeText(path).then(() => {
            this.showStatus('Path copied to clipboard!', 'success');
            setTimeout(() => this.hideModal(), 1000);
        }).catch(() => {
            this.showStatus('Failed to copy path', 'error');
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportSVG() {
        if (!this.repoData || !this.exportBounds) {
            this.showStatus('No diagram to export', 'error');
            return;
        }

        const { x: minX, y: minY, width, height } = this.exportBounds;
        const nodeWidth = this.nodeWidth;
        const nodeHeight = this.nodeHeight;
        const isDark = document.body.classList.contains('dark');

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Background
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', minX);
        bgRect.setAttribute('y', minY);
        bgRect.setAttribute('width', width);
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('fill', isDark ? '#0f172a' : '#ffffff');
        svg.appendChild(bgRect);

        // Draw connections (lines)
        const connLines = this.connectionsSvg.querySelectorAll('line');
        connLines.forEach(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            path.setAttribute('x1', x1);
            path.setAttribute('y1', y1);
            path.setAttribute('x2', x2);
            path.setAttribute('y2', y2);
            path.setAttribute('stroke', isDark ? '#475569' : '#94a3b8');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
        });

        // Draw nodes as SVG groups
        const nodeElements = this.nodesContainer.querySelectorAll('.node');
        nodeElements.forEach(node => {
            const x = parseFloat(node.style.left);
            const y = parseFloat(node.style.top);
            const type = node.dataset.type;
            const nameEl = node.querySelector('.node-name');
            const name = nameEl ? nameEl.textContent : 'Unknown';
            
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Node background (rectangle with glass effect)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', nodeWidth);
            rect.setAttribute('height', nodeHeight);
            rect.setAttribute('rx', '12');
            rect.setAttribute('fill', isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.85)');
            rect.setAttribute('stroke', type === 'tree' ? '#3b82f6' : (isDark ? '#64748b' : '#94a3b8'));
            rect.setAttribute('stroke-width', '2');
            // Add subtle glass highlight
            if (!isDark) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                filter.setAttribute('id', 'glassHighlight');
                const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
                feGaussianBlur.setAttribute('in', 'SourceAlpha');
                feGaussianBlur.setAttribute('stdDeviation', '3');
                const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
                feOffset.setAttribute('dx', '0');
                feOffset.setAttribute('dy', '2');
                const feComponentTransfer = document.createElementNS('http://www.w3.org/2000/svg', 'feComponentTransfer');
                const feFuncA = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncA');
                feFuncA.setAttribute('type', 'table');
                const feTable = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncA');
                // Simple shadow
                filter.appendChild(feGaussianBlur);
                filter.appendChild(feOffset);
                defs.appendChild(filter);
                if (!svg.querySelector('defs')) {
                    svg.appendChild(defs);
                }
                rect.setAttribute('filter', 'url(#glassHighlight)');
            }
            group.appendChild(rect);
            
            // Icon (emoji as text)
            const icon = this.getFileIcon(node);
            const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            iconText.setAttribute('x', x + nodeWidth / 2);
            iconText.setAttribute('y', y + 28);
            iconText.setAttribute('text-anchor', 'middle');
            iconText.setAttribute('font-size', '24px');
            iconText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
            iconText.textContent = icon;
            group.appendChild(iconText);
            
            // Name
            const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameText.setAttribute('x', x + nodeWidth / 2);
            nameText.setAttribute('y', y + 58);
            nameText.setAttribute('text-anchor', 'middle');
            nameText.setAttribute('font-size', '11px');
            nameText.setAttribute('font-weight', 'bold');
            nameText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
            // Truncate name if too long
            const maxChars = 18;
            if (name.length > maxChars) {
                nameText.textContent = name.substring(0, maxChars - 2) + '...';
            } else {
                nameText.textContent = name;
            }
            group.appendChild(nameText);
            
            // File count for directories (small text)
            if (type === 'tree') {
                const fileCount = this.countFiles(node);
                const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                countText.setAttribute('x', x + nodeWidth / 2);
                countText.setAttribute('y', y + nodeHeight - 8);
                countText.setAttribute('text-anchor', 'middle');
                countText.setAttribute('font-size', '9px');
                countText.setAttribute('fill', isDark ? '#94a3b8' : '#64748b');
                countText.textContent = `${fileCount} items`;
                group.appendChild(countText);
            }
            
            svg.appendChild(group);
        });

        // Export
        const svgData = new XMLSerializer().serializeToString(svg);
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
        if (!this.repoData || !this.exportBounds) {
            this.showStatus('No diagram to export', 'error');
            return;
        }

        if (this.isExporting) return;
        this.isExporting = true;
        this.showExportLoading('PNG');

        try {
            const { x: minX, y: minY, width, height } = this.exportBounds;
            const nodeWidth = this.nodeWidth;
            const nodeHeight = this.nodeHeight;
            const isDark = document.body.classList.contains('dark');

            // Create SVG (same as exportSVG but without immediate export)
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Background
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', minX);
            bgRect.setAttribute('y', minY);
            bgRect.setAttribute('width', width);
            bgRect.setAttribute('height', height);
            bgRect.setAttribute('fill', isDark ? '#0f172a' : '#ffffff');
            svg.appendChild(bgRect);

            // Draw connections (lines)
            const connLines = this.connectionsSvg.querySelectorAll('line');
            connLines.forEach(line => {
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                path.setAttribute('x1', x1);
                path.setAttribute('y1', y1);
                path.setAttribute('x2', x2);
                path.setAttribute('y2', y2);
                path.setAttribute('stroke', isDark ? '#475569' : '#94a3b8');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);
            });

            // Draw nodes as SVG groups
            const nodeElements = this.nodesContainer.querySelectorAll('.node');
            nodeElements.forEach(node => {
                const x = parseFloat(node.style.left);
                const y = parseFloat(node.style.top);
                const type = node.dataset.type;
                const nameEl = node.querySelector('.node-name');
                const name = nameEl ? nameEl.textContent : 'Unknown';
                
                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // Node background (rectangle with glass effect)
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', nodeWidth);
                rect.setAttribute('height', nodeHeight);
                rect.setAttribute('rx', '12');
                rect.setAttribute('fill', isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.85)');
                rect.setAttribute('stroke', type === 'tree' ? '#3b82f6' : (isDark ? '#64748b' : '#94a3b8'));
                rect.setAttribute('stroke-width', '2');
                group.appendChild(rect);
                
                // Icon (emoji as text)
                const icon = this.getFileIcon(node);
                const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                iconText.setAttribute('x', x + nodeWidth / 2);
                iconText.setAttribute('y', y + 28);
                iconText.setAttribute('text-anchor', 'middle');
                iconText.setAttribute('font-size', '24px');
                iconText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
                iconText.textContent = icon;
                group.appendChild(iconText);
                
                // Name
                const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                nameText.setAttribute('x', x + nodeWidth / 2);
                nameText.setAttribute('y', y + 58);
                nameText.setAttribute('text-anchor', 'middle');
                nameText.setAttribute('font-size', '11px');
                nameText.setAttribute('font-weight', 'bold');
                nameText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
                const maxChars = 18;
                if (name.length > maxChars) {
                    nameText.textContent = name.substring(0, maxChars - 2) + '...';
                } else {
                    nameText.textContent = name;
                }
                group.appendChild(nameText);
                
                // File count for directories
                if (type === 'tree') {
                    const fileCount = this.countFiles(node);
                    const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    countText.setAttribute('x', x + nodeWidth / 2);
                    countText.setAttribute('y', y + nodeHeight - 8);
                    countText.setAttribute('text-anchor', 'middle');
                    countText.setAttribute('font-size', '9px');
                    countText.setAttribute('fill', isDark ? '#94a3b8' : '#64748b');
                    countText.textContent = `${fileCount} items`;
                    group.appendChild(countText);
                }
                
                svg.appendChild(group);
            });

            // Convert SVG to PNG using canvas
            this.svgToPng(svg, width, height);
        } catch (error) {
            console.error('Export PNG error:', error);
            this.showStatus('Failed to export PNG: ' + error.message, 'error');
        } finally {
            this.isExporting = false;
            this.hideExportLoading();
        }
    }

    getFileIcon(node) {
        if (node.type === 'tree') return '📁';
        const ext = this.getFileExtension(node.name).toLowerCase();
        return this.iconMap[ext] || '📄';
    }

    svgToPng(svgElement, width, height) {
        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgElement);
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create an image from SVG data
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            try {
                // Draw white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                // Draw SVG image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to PNG and download
                canvas.toBlob((blob) => {
                    try {
                        if (!blob) {
                            this.showStatus('Failed to generate PNG', 'error');
                            return;
                        }
                        const pngUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = pngUrl;
                        a.download = `${this.currentRepo.replace('/', '-')}-diagram.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(pngUrl);
                        this.showStatus('PNG exported!', 'success');
                    } finally {
                        URL.revokeObjectURL(url);
                    }
                }, 'image/png');
            } catch (error) {
                console.error('PNG generation error:', error);
                this.showStatus('Failed to generate PNG: ' + error.message, 'error');
                URL.revokeObjectURL(url);
            }
        };
        
        img.onerror = () => {
            this.showStatus('Failed to generate PNG', 'error');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    exportPDF() {
        if (!this.repoData || !this.exportBounds) {
            this.showStatus('Please load a repository first', 'error');
            return;
        }

        if (this.isExporting) return;
        this.isExporting = true;
        this.showExportLoading('PDF');

        try {
            const { x: minX, y: minY, width, height } = this.exportBounds;
            const nodeWidth = this.nodeWidth;
            const nodeHeight = this.nodeHeight;
            const isDark = document.body.classList.contains('dark');

            // Create SVG element (same as exportSVG)
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', width);
            svg.setAttribute('height', height);
            svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Background (same as exportPNG)
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', minX);
            bgRect.setAttribute('y', minY);
            bgRect.setAttribute('width', width);
            bgRect.setAttribute('height', height);
            bgRect.setAttribute('fill', isDark ? '#0f172a' : '#ffffff');
            svg.appendChild(bgRect);

            // Draw connections (lines)
            const connLines = this.connectionsSvg.querySelectorAll('line');
            connLines.forEach(line => {
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                path.setAttribute('x1', x1);
                path.setAttribute('y1', y1);
                path.setAttribute('x2', x2);
                path.setAttribute('y2', y2);
                path.setAttribute('stroke', isDark ? '#475569' : '#94a3b8');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');
                svg.appendChild(path);
            });

            // Draw nodes as SVG groups (same as exportPNG)
            const nodeElements = this.nodesContainer.querySelectorAll('.node');
            nodeElements.forEach(node => {
                const x = parseFloat(node.style.left);
                const y = parseFloat(node.style.top);
                const type = node.dataset.type;
                const nameEl = node.querySelector('.node-name');
                const name = nameEl ? nameEl.textContent : 'Unknown';

                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                // Node background
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', nodeWidth);
                rect.setAttribute('height', nodeHeight);
                rect.setAttribute('rx', 8);
                rect.setAttribute('fill', isDark ? '#1e293b' : '#ffffff');
                rect.setAttribute('stroke', isDark ? '#334155' : '#e2e8f0');
                rect.setAttribute('stroke-width', '2');
                group.appendChild(rect);

                // Icon
                const icon = this.getFileIcon(node);
                const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                iconText.setAttribute('x', x + nodeWidth / 2);
                iconText.setAttribute('y', y + 28);
                iconText.setAttribute('text-anchor', 'middle');
                iconText.setAttribute('font-size', '24px');
                iconText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
                iconText.textContent = icon;
                group.appendChild(iconText);

                // Name
                const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                nameText.setAttribute('x', x + nodeWidth / 2);
                nameText.setAttribute('y', y + 58);
                nameText.setAttribute('text-anchor', 'middle');
                nameText.setAttribute('font-size', '11px');
                nameText.setAttribute('font-weight', 'bold');
                nameText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
                const maxChars = 18;
                if (name.length > maxChars) {
                    nameText.textContent = name.substring(0, maxChars - 2) + '...';
                } else {
                    nameText.textContent = name;
                }
                group.appendChild(nameText);

                // File count for directories
                if (type === 'tree') {
                    const fileCount = this.countFiles(node);
                    const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    countText.setAttribute('x', x + nodeWidth / 2);
                    countText.setAttribute('y', y + nodeHeight - 8);
                    countText.setAttribute('text-anchor', 'middle');
                    countText.setAttribute('font-size', '9px');
                    countText.setAttribute('fill', isDark ? '#94a3b8' : '#64748b');
                    countText.textContent = `${fileCount} items`;
                    group.appendChild(countText);
                }

                svg.appendChild(group);
            }

            // Convert SVG to canvas (same as PNG)
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                try {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Use jsPDF to create PDF
                    const { jsPDF } = window;
                    if (!jsPDF) {
                        throw new Error('jsPDF library not loaded');
                    }

                    const pdf = new jsPDF({
                        orientation: width > height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [width, height]
                    });

                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
                    pdf.save(`${this.currentRepo.replace('/', '-')}-diagram.pdf`);

                    this.showStatus('PDF exported!', 'success');
                } catch (error) {
                    console.error('PDF generation error:', error);
                    this.showStatus('Failed to generate PDF: ' + error.message, 'error');
                } finally {
                    URL.revokeObjectURL(url);
                }
            };

            img.onerror = () => {
                this.showStatus('Failed to generate PDF', 'error');
                URL.revokeObjectURL(url);
            };

            img.src = url;
        } catch (error) {
            console.error('Export PDF error:', error);
            this.showStatus('Failed to export PDF: ' + error.message, 'error');
        } finally {
            this.isExporting = false;
            this.hideExportLoading();
        }
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

    // ... existing methods ...

    // Export loading states
    showExportLoading(format) {
        const overlay = document.getElementById('export-loading');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.querySelector('p').textContent = `Exporting to ${format}...`;
        }
    }

    hideExportLoading() {
        const overlay = document.getElementById('export-loading');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    saveUndoState() {
        const content = this.mermaidCode ? this.mermaidCode.getValue() : '';
        this.undoStack.push(content);
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const prevState = this.undoStack[this.undoStack.length - 1];
            if (this.mermaidCode) {
                if (typeof this.mermaidCode.setValue === 'function') {
                    this.mermaidCode.setValue(prevState);
                } else {
                    this.mermaidCode.value = prevState;
                }
            }
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            if (this.mermaidCode) {
                if (typeof this.mermaidCode.setValue === 'function') {
                    this.mermaidCode.setValue(nextState);
                } else {
                    this.mermaidCode.value = nextState;
                }
            }
        }
    }

    // Tab Navigation
    switchTab(tabName) {
        this.currentTab = tabName;
        
        if (tabName === 'diagram') {
            this.tabDiagram.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'shadow-md');
            this.tabDiagram.classList.remove('text-slate-600', 'hover:bg-slate-100');
            this.tabMermaid.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'shadow-md');
            this.tabMermaid.classList.add('text-slate-600', 'hover:bg-slate-100');
            this.diagramTab.classList.remove('hidden');
            this.mermaidTab.classList.add('hidden');
        } else {
            this.tabMermaid.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'shadow-md');
            this.tabMermaid.classList.remove('text-slate-600', 'hover:bg-slate-100');
            this.tabDiagram.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'shadow-md');
            this.tabDiagram.classList.add('text-slate-600', 'hover:bg-slate-100');
            this.mermaidTab.classList.remove('hidden');
            this.diagramTab.classList.add('hidden');
        }
    }

    // Zoom and Pan
    setZoom(newZoom, center) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.1, Math.min(3, newZoom));
        
        // Adjust pan to zoom towards the specified center point (or container center by default)
        if (center) {
            const rect = this.diagram.getBoundingClientRect();
            const cx = center.x - rect.left; // relative to container
            const cy = center.y - rect.top;
            
            // Convert viewport point to world coordinates before zoom
            const worldX = (cx - this.panX) / oldZoom;
            const worldY = (cy - this.panY) / oldZoom;
            
            // Adjust pan so that the world point stays at the same viewport position
            this.panX = cx - worldX * this.zoom;
            this.panY = cy - worldY * this.zoom;
        } else {
            // Default: zoom towards center of container
            const rect = this.diagram.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            
            const worldX = (cx - this.panX) / oldZoom;
            const worldY = (cy - this.panY) / oldZoom;
            
            this.panX = cx - worldX * this.zoom;
            this.panY = cy - worldY * this.zoom;
        }
        
        this.updateZoomDisplay();
        this.applyTransform();
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomDisplay();
        this.applyTransform();
    }

    updateZoomDisplay() {
        this.zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
    }

    calculateExportBounds(layout, nodeWidth) {
        if (!layout || layout.size === 0) {
            this.exportBounds = null;
            return;
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const nodeHeight = this.nodeHeight;
        const padding = 20;
        
        for (const [id, { x, y }] of layout) {
            const nodeLeft = x;
            const nodeRight = x + nodeWidth;
            const nodeTop = y;
            const nodeBottom = y + nodeHeight;
            
            minX = Math.min(minX, nodeLeft);
            minY = Math.min(minY, nodeTop);
            maxX = Math.max(maxX, nodeRight);
            maxY = Math.max(maxY, nodeBottom);
        }
        
        // Add padding
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Store bounds for export
        this.exportBounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    applyTransform() {
        this.nodesContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.nodesContainer.style.transformOrigin = '0 0';
        this.connectionsSvg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.connectionsSvg.style.transformOrigin = '0 0';
    }

    togglePanMode() {
        this.isPanMode = !this.isPanMode;
        if (this.isPanMode) {
            this.panModeBtn.classList.add('bg-blue-100', 'text-blue-700');
            this.panModeBtn.classList.remove('bg-slate-100', 'text-slate-700');
            this.diagram.style.cursor = 'grab';
        } else {
            this.panModeBtn.classList.remove('bg-blue-100', 'text-blue-700');
            this.panModeBtn.classList.add('bg-slate-100', 'text-slate-700');
            this.diagram.style.cursor = 'default';
        }
    }

    handleMouseDown(e) {
        if (!this.isPanMode) return;
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
        this.diagram.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.isPanMode) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.applyTransform();
    }

    handleMouseUp() {
        this.isDragging = false;
        if (this.isPanMode) {
            this.diagram.style.cursor = 'grab';
        }
    }

    handleWheel(e) {
        if (!this.isPanMode) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.setZoom(this.zoom + delta, e);
    }

    // Mermaid Editor with CodeMirror
    initMermaidEditor() {
        // Load Mermaid library dynamically
        const mermaidScript = document.createElement('script');
        mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        mermaidScript.onload = () => {
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
            });
            // Set initial preview if there's code
            if (this.mermaidCode && this.mermaidCode.getValue()) {
                this.updateMermaidPreview();
            }
        };
        document.head.appendChild(mermaidScript);
        
        // Initialize CodeMirror
        const editorElement = document.getElementById('mermaidEditor');
        if (editorElement && typeof CodeMirror !== 'undefined') {
            this.mermaidCode = CodeMirror(editorElement, {
                mode: 'markdown',
                theme: 'default',
                lineNumbers: true,
                lineWrapping: true,
                autofocus: false,
                tabSize: 4,
                indentUnit: 4,
                extraKeys: {
                    'Ctrl-Enter': () => this.updateMermaidPreview(),
                    'Cmd-Enter': () => this.updateMermaidPreview()
                }
            });
            
            // Set initial placeholder/template
            this.mermaidCode.setValue(`graph TD
    A[Start] --> B{Decide}
    B -->|Yes| C[Do Thing]
    B -->|No| D[End]
    C --> D`);
            
            // Update preview on change (debounced)
            let timeout;
            this.mermaidCode.on('change', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => this.updateMermaidPreview(), 500);
            });
            
            // Initial preview
            this.updateMermaidPreview();
        } else {
            // Fallback to textarea if CodeMirror fails to load
            console.warn('CodeMirror not available, falling back to textarea');
            const textarea = document.createElement('textarea');
            textarea.id = 'mermaidCode';
            textarea.className = 'flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none min-h-[400px] backdrop-blur-sm';
            textarea.placeholder = `graph TD
    A[Start] --> B{Decide}
    B -->|Yes| C[Do Thing]
    B -->|No| D[End]`;
            editorElement.replaceWith(textarea);
            this.mermaidCode = textarea;
            textarea.addEventListener('input', () => this.updateMermaidPreview());
        }
    }

    bindMermaidEvents() {
        // Template insertion buttons
        if (this.insertGraphBtn) {
            this.insertGraphBtn.addEventListener("click", () => this.insertMermaidTemplate("graph"));
        }
        if (this.insertFlowchartBtn) {
            this.insertFlowchartBtn.addEventListener("click", () => this.insertMermaidTemplate("flowchart"));
        }
        if (this.insertSequenceBtn) {
            this.insertSequenceBtn.addEventListener("click", () => this.insertMermaidTemplate("sequence"));
        }
        if (this.insertClassBtn) {
            this.insertClassBtn.addEventListener("click", () => this.insertMermaidTemplate("class"));
        }
        if (this.insertStateBtn) {
            this.insertStateBtn.addEventListener("click", () => this.insertMermaidTemplate("state"));
        }
        if (this.insertGanttBtn) {
            this.insertGanttBtn.addEventListener("click", () => this.insertMermaidTemplate("gantt"));
        }
        
        // Clear and export buttons
        if (this.clearEditorBtn) {
            this.clearEditorBtn.addEventListener("click", () => this.clearMermaidEditor());
        }
        if (this.exportMermaidBtn) {
            this.exportMermaidBtn.addEventListener("click", () => this.exportMermaidFile());
        }
        if (this.exportMermaidPNGBtn) {
            this.exportMermaidPNGBtn.addEventListener("click", () => this.exportMermaidPNG());
        }
    }

    updateMermaidPreview() {
        let code;
        if (this.mermaidCode && typeof this.mermaidCode.getValue === 'function') {
            code = this.mermaidCode.getValue().trim();
        } else if (this.mermaidCode) {
            code = this.mermaidCode.value.trim();
        } else {
            return;
        }
        
        if (!code) {
            this.mermaidPreview.innerHTML = '<div class="text-slate-400 text-center py-16">Your diagram preview will appear here</div>';
            return;
        }

        // Check if mermaid is loaded
        if (typeof mermaid === 'undefined') {
            this.mermaidPreview.innerHTML = '<div class="text-red-500">Mermaid library loading...</div>';
            return;
        }

        // Render diagram
        try {
            const id = 'mermaid-preview-' + Date.now();
            const { svg } = mermaid.render(id, code);
            this.mermaidPreview.innerHTML = svg;
            
            // Apply dark mode styling if active
            if (document.body.classList.contains('dark')) {
                const svgEl = this.mermaidPreview.querySelector('svg');
                if (svgEl) {
                    svgEl.style.filter = 'brightness(0.9)';
                }
            }
        } catch (error) {
            this.mermaidPreview.innerHTML = `
                <div class="text-red-500 p-4">
                    <strong>Render Error:</strong><br>
                    ${this.escapeHtml(error.message)}
                </div>
            `;
        }
    }

    insertMermaidTemplate(type) {
        const templates = {
            graph: `graph TD
    A[Start] --> B{Decide}
    B -->|Yes| C[Do Thing]
    B -->|No| D[End]
    C --> D`,
            flowchart: `flowchart TD
    Start --> Stop
    Stop --> End`,
            sequence: `sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response`,
            class: `classDiagram
    class Animal {
        +String name
        +eat()
        +move()
    }
    class Duck {
        +quack()
    }
    Animal <|-- Duck`,
            state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
            gantt: `gantt
    title Project Timeline
    section Design
    Design :done, 2024-01-01, 3d
    section Development
    Dev :active, 2024-01-04, 5d
    section Testing
    Test :2024-01-09, 4d`
        };

        const template = templates[type];
        if (template) {
            if (this.mermaidCode && typeof this.mermaidCode.setValue === 'function') {
                this.mermaidCode.setValue(template);
            } else if (this.mermaidCode) {
                this.mermaidCode.value = template;
            }
            this.updateMermaidPreview();
            if (this.mermaidCode && typeof this.mermaidCode.focus === 'function') {
                this.mermaidCode.focus();
            } else if (this.mermaidCode) {
                this.mermaidCode.focus();
            }
        }
    }

    clearMermaidEditor() {
        if (this.mermaidCode && typeof this.mermaidCode.setValue === 'function') {
            this.mermaidCode.setValue('');
        } else if (this.mermaidCode) {
            this.mermaidCode.value = '';
        }
        this.mermaidPreview.innerHTML = '<div class="text-slate-400 text-center py-16">Your diagram preview will appear here</div>';
    }

    exportMermaidFile() {
        let code;
        if (this.mermaidCode && typeof this.mermaidCode.getValue === 'function') {
            code = this.mermaidCode.getValue();
        } else if (this.mermaidCode) {
            code = this.mermaidCode.value;
        } else {
            this.showStatus('No Mermaid code to export', 'error');
            return;
        }
        
        if (!code.trim()) {
            this.showStatus('No Mermaid code to export', 'error');
            return;
        }

        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.mmd';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('Mermaid file exported!', 'success');
    }

    exportMermaidPNG() {
        let code;
        if (this.mermaidCode && typeof this.mermaidCode.getValue === 'function') {
            code = this.mermaidCode.getValue();
        } else if (this.mermaidCode) {
            code = this.mermaidCode.value;
        } else {
            this.showStatus('No Mermaid code to export', 'error');
            return;
        }
        
        if (!code.trim()) {
            this.showStatus('No Mermaid code to export', 'error');
            return;
        }

        try {
            // Render to SVG first
            const id = 'mermaid-export-' + Date.now();
            mermaid.render(id, code).then(({ svg }) => {
                // Convert SVG to PNG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        const pngUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = pngUrl;
                        a.download = 'diagram.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(pngUrl);
                        this.showStatus('PNG exported!', 'success');
                    }, 'image/png');
                    
                    URL.revokeObjectURL(url);
                };
                
                img.onerror = () => {
                    this.showStatus('Failed to generate PNG from Mermaid', 'error');
                };
                
                img.src = url;
            }).catch(error => {
                this.showStatus('Mermaid render error: ' + error.message, 'error');
            });
        } catch (error) {
            this.showStatus('Export failed: ' + error.message, 'error');
        }
    }

    // Helper: Convert SVG to PNG
    svgToPng(svgElement, width, height) {
        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svgElement);
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create an image from SVG data
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            // Draw white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            // Draw SVG image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
                const pngUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `${this.currentRepo.replace('/', '-')}-diagram.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
                this.showStatus('PNG exported!', 'success');
            }, 'image/png');
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            this.showStatus('Failed to generate PNG', 'error');
        };
        
        img.src = url;
    }
}

// Export Functions (Global)
// ==========================

function exportToSVG() {
    const app = window.app;
    if (!app || !app.repoData || !app.exportBounds) {
        showStatus('No diagram to export', 'error');
        return;
    }

    const { x: minX, y: minY, width, height } = app.exportBounds;
    const nodeWidth = app.nodeWidth;
    const nodeHeight = app.nodeHeight;
    const isDark = document.body.classList.contains('dark');

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', minX);
    bgRect.setAttribute('y', minY);
    bgRect.setAttribute('width', width);
    bgRect.setAttribute('height', height);
    bgRect.setAttribute('fill', isDark ? '#0f172a' : '#ffffff');
    svg.appendChild(bgRect);

    // Draw connections (lines)
    const connLines = app.connectionsSvg.querySelectorAll('line');
    connLines.forEach(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', x1);
        path.setAttribute('y1', y1);
        path.setAttribute('x2', x2);
        path.setAttribute('y2', y2);
        path.setAttribute('stroke', isDark ? '#475569' : '#94a3b8');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
    });

    // Draw nodes as SVG groups
    const nodeElements = app.nodesContainer.querySelectorAll('.node');
    nodeElements.forEach(node => {
        const x = parseFloat(node.style.left);
        const y = parseFloat(node.style.top);
        const type = node.dataset.type;
        const nameEl = node.querySelector('.node-name');
        const name = nameEl ? nameEl.textContent : 'Unknown';
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Node background (rectangle with glass effect)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', nodeWidth);
        rect.setAttribute('height', nodeHeight);
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.85)');
        rect.setAttribute('stroke', type === 'tree' ? '#3b82f6' : (isDark ? '#64748b' : '#94a3b8'));
        rect.setAttribute('stroke-width', '2');
        group.appendChild(rect);
        
        // Icon (emoji as text)
        const icon = app.getFileIcon(node);
        const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        iconText.setAttribute('x', x + nodeWidth / 2);
        iconText.setAttribute('y', y + 28);
        iconText.setAttribute('text-anchor', 'middle');
        iconText.setAttribute('font-size', '24px');
        iconText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
        iconText.textContent = icon;
        group.appendChild(iconText);
        
        // Name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', x + nodeWidth / 2);
        nameText.setAttribute('y', y + 58);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-size', '11px');
        nameText.setAttribute('font-weight', 'bold');
        nameText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
        const maxChars = 18;
        if (name.length > maxChars) {
            nameText.textContent = name.substring(0, maxChars - 2) + '...';
        } else {
            nameText.textContent = name;
        }
        group.appendChild(nameText);
        
        // File count for directories
        if (type === 'tree') {
            const fileCount = app.countFiles(node);
            const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            countText.setAttribute('x', x + nodeWidth / 2);
            countText.setAttribute('y', y + nodeHeight - 8);
            countText.setAttribute('text-anchor', 'middle');
            countText.setAttribute('font-size', '9px');
            countText.setAttribute('fill', isDark ? '#94a3b8' : '#64748b');
            countText.textContent = `${fileCount} items`;
            group.appendChild(countText);
        }
        
        svg.appendChild(group);
    });

    // Export
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.currentRepo.replace('/', '-')}-diagram.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    app.showStatus('SVG exported!', 'success');
}

function exportToPNG() {
    const app = window.app;
    if (!app || !app.repoData || !app.exportBounds) {
        app.showStatus('No diagram to export', 'error');
        return;
    }

    const { x: minX, y: minY, width, height } = app.exportBounds;
    const nodeWidth = app.nodeWidth;
    const nodeHeight = app.nodeHeight;
    const isDark = document.body.classList.contains('dark');

    // Create SVG (same as exportSVG but without immediate export)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', minX);
    bgRect.setAttribute('y', minY);
    bgRect.setAttribute('width', width);
    bgRect.setAttribute('height', height);
    bgRect.setAttribute('fill', isDark ? '#0f172a' : '#ffffff');
    svg.appendChild(bgRect);

    // Draw connections (lines)
    const connLines = app.connectionsSvg.querySelectorAll('line');
    connLines.forEach(line => {
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', x1);
        path.setAttribute('y1', y1);
        path.setAttribute('x2', x2);
        path.setAttribute('y2', y2);
        path.setAttribute('stroke', isDark ? '#475569' : '#94a3b8');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
    });

    // Draw nodes as SVG groups
    const nodeElements = app.nodesContainer.querySelectorAll('.node');
    nodeElements.forEach(node => {
        const x = parseFloat(node.style.left);
        const y = parseFloat(node.style.top);
        const type = node.dataset.type;
        const nameEl = node.querySelector('.node-name');
        const name = nameEl ? nameEl.textContent : 'Unknown';
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Node background (rectangle with glass effect)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', nodeWidth);
        rect.setAttribute('height', nodeHeight);
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.85)');
        rect.setAttribute('stroke', type === 'tree' ? '#3b82f6' : (isDark ? '#64748b' : '#94a3b8'));
        rect.setAttribute('stroke-width', '2');
        group.appendChild(rect);
        
        // Icon (emoji as text)
        const icon = app.getFileIcon(node);
        const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        iconText.setAttribute('x', x + nodeWidth / 2);
        iconText.setAttribute('y', y + 28);
        iconText.setAttribute('text-anchor', 'middle');
        iconText.setAttribute('font-size', '24px');
        iconText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
        iconText.textContent = icon;
        group.appendChild(iconText);
        
        // Name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', x + nodeWidth / 2);
        nameText.setAttribute('y', y + 58);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-size', '11px');
        nameText.setAttribute('font-weight', 'bold');
        nameText.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
        const maxChars = 18;
        if (name.length > maxChars) {
            nameText.textContent = name.substring(0, maxChars - 2) + '...';
        } else {
            nameText.textContent = name;
        }
        group.appendChild(nameText);
        
        // File count for directories
        if (type === 'tree') {
            const fileCount = app.countFiles(node);
            const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            countText.setAttribute('x', x + nodeWidth / 2);
            countText.setAttribute('y', y + nodeHeight - 8);
            countText.setAttribute('text-anchor', 'middle');
            countText.setAttribute('font-size', '9px');
            countText.setAttribute('fill', isDark ? '#94a3b8' : '#64748b');
            countText.textContent = `${fileCount} items`;
            group.appendChild(countText);
        }
        
        svg.appendChild(group);
    });

    // Convert SVG to PNG using canvas
    app.svgToPng(svg, width, height);
}

function exportToPDF() {
    const app = window.app;
    if (!app || !app.repoData || !app.exportBounds) {
        app.showStatus('No diagram to export', 'error');
        return;
    }

    // Use html2canvas to capture the diagram container
    const diagram = app.diagram;
    if (!diagram) {
        app.showStatus('Diagram element not found', 'error');
        return;
    }

    // Temporarily hide UI elements
    const originalDisplay = {};
    const uiElements = document.querySelectorAll('#controlsBg, .tab-navigation, footer, #status');
    uiElements.forEach(el => {
        originalDisplay[el] = el.style.display;
        el.style.display = 'none';
    });

    // Use html2canvas to capture
    html2canvas(diagram, {
        backgroundColor: document.body.classList.contains('dark') ? '#0f172a' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Restore UI elements
        uiElements.forEach(el => {
            el.style.display = originalDisplay[el] || '';
        });

        // Create PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const x = 10;
        const y = 10;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${app.currentRepo.replace('/', '-')}-diagram.pdf`);

        app.showStatus('PDF exported!', 'success');
    }).catch(error => {
        console.error('Export PDF error:', error);
        app.showStatus('Failed to export PDF: ' + error.message, 'error');
        // Restore UI on error
        uiElements.forEach(el => {
            el.style.display = originalDisplay[el] || '';
        });
    });
}

function exportMermaid() {
    const app = window.app;
    const editor = app.mermaidCode;
    if (!editor) {
        showStatus('Mermaid editor not found', 'error');
        return;
    }

    let code;
    if (typeof editor.getValue === 'function') {
        code = editor.getValue();
    } else {
        code = editor.value;
    }

    if (!code.trim()) {
        showStatus('No Mermaid code to export', 'error');
        return;
    }

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('Mermaid code downloaded!', 'success');
}

function exportMermaidPNG() {
    const app = window.app;
    const editor = app.mermaidCode;
    if (!editor) {
        app.showStatus('Mermaid editor not found', 'error');
        return;
    }

    let code;
    if (typeof editor.getValue === 'function') {
        code = editor.getValue();
    } else {
        code = editor.value;
    }

    if (!code.trim()) {
        app.showStatus('No Mermaid code to export', 'error');
        return;
    }

    try {
        // Render to SVG first
        const id = 'mermaid-export-' + Date.now();
        mermaid.render(id, code).then(({ svg }) => {
            // Convert SVG to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const pngUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = `mermaid-diagram-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(pngUrl);
                    app.showStatus('Mermaid PNG exported!', 'success');
                }, 'image/png');
                
                URL.revokeObjectURL(url);
            };
            
            img.onerror = () => {
                app.showStatus('Failed to generate PNG from Mermaid', 'error');
            };
            
            img.src = url;
        }).catch(error => {
            app.showStatus('Mermaid render error: ' + error.message, 'error');
        });
    } catch (error) {
        app.showStatus('Export failed: ' + error.message, 'error');
    }
}

// Initialize app
// Initialize app after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.app = new RepoDiagram();
});
