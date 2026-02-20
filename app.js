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
        
        this.initElements();
        this.bindEvents();
        this.initMermaidEditor();
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
    }

    bindEvents() {
        this.loadBtn.addEventListener('click', () => this.loadRepo());
        this.repoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadRepo();
        });
        
        // Branch selection change - reload with new branch
        this.branchSelect.addEventListener('change', (e) => {
            if (this.currentRepo && e.target.value) {
                this.currentBranch = e.target.value;
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
        
        // Tab navigation
        this.tabDiagram.addEventListener('click', () => this.switchTab('diagram'));
        this.tabMermaid.addEventListener('click', () => this.switchTab('mermaid'));
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom + 0.1));
        this.zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom - 0.1));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
        this.panModeBtn.addEventListener('click', () => this.togglePanMode());
        
        // Pan/drag events
        this.diagram.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        this.diagram.addEventListener('wheel', (e) => this.handleWheel(e));
        
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
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextNode(nodes, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusNextNode(nodes, -1);
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

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setInCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
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
        
        // Apply current zoom/pan transform
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
        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'treeitem');
        container.setAttribute('aria-label', `${node.type === 'tree' ? 'Folder' : 'File'}: ${node.name || 'Unknown'}`);
        container.setAttribute('aria-expanded', node.type === 'tree' ? (this.expanded.has(node.path || 'root') ? 'true' : 'false') : 'null');
        container.dataset.path = node.path || 'root';
        container.dataset.type = node.type || 'blob';

        // Set border color based on type and level
        const level = node.path ? node.path.split('/').length : 0;
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

        // Icon based on type
        const icon = node.type === 'tree' ? '📁' : '📄';
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
    setZoom(newZoom) {
        this.zoom = Math.max(0.1, Math.min(3, newZoom));
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

    applyTransform() {
        this.nodesContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
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
        this.setZoom(this.zoom + delta);
    }

    // Mermaid Editor
    initMermaidEditor() {
        // Load Mermaid library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.onload = () => {
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
            });
            // Set initial preview if there's code
            if (this.mermaidCode.value.trim()) {
                this.updateMermaidPreview();
            }
        };
        document.head.appendChild(script);
        
        // Load CodeMirror for syntax highlighting (optional, lightweight version)
        // We'll use a simple textarea for now to keep it lightweight
        // Can add CodeMirror later if needed
    }

    updateMermaidPreview() {
        const code = this.mermaidCode.value.trim();
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
            this.mermaidCode.value = template;
            this.updateMermaidPreview();
            this.mermaidCode.focus();
        }
    }

    clearMermaidEditor() {
        this.mermaidCode.value = '';
        this.mermaidPreview.innerHTML = '<div class="text-slate-400 text-center py-16">Your diagram preview will appear here</div>';
    }

    exportMermaidFile() {
        const code = this.mermaidCode.value;
        if (!code) {
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
        const code = this.mermaidCode.value;
        if (!code) {
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
                
                img.src = url;
            });
        } catch (error) {
            this.showStatus('Export failed: ' + error.message, 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RepoDiagram();
});