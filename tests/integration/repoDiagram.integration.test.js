/**
 * Integration Tests - Testing UI interactions and DOM manipulation
 */

import { fireEvent, waitFor, screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import RepoDiagram from '../app.js';

// Helper to create a complete DOM environment
const setupDOM = () => {
  document.body.innerHTML = `
    <div class="min-h-screen from-slate-50 via-blue-50 to-purple-50">
      <div id="controlsBg" class="bg-white">
        <input id="repoInput" placeholder="owner/repo" />
        <select id="branchSelect"></select>
        <button id="loadBtn">Load</button>
        <button id="expandAllBtn">Expand All</button>
        <button id="collapseAllBtn">Collapse All</button>
        <button id="exportSVGBtn">Export SVG</button>
        <button id="exportPNGBtn">Export PNG</button>
        <input id="searchInput" placeholder="Search..." />
        <select id="depthSelect">
          <option value="1">1</option>
          <option value="2" selected>2</option>
          <option value="3">3</option>
        </select>
        <select id="layoutSelect">
          <option value="tree" selected>Tree</option>
          <option value="horizontal">Horizontal</option>
          <option value="radial">Radial</option>
        </select>
        <button id="darkModeBtn">Dark Mode</button>
        <button id="exportPDFBtn">Export PDF</button>
        <button id="exportMermaidBtn">Export Mermaid</button>
        <div id="tabDiagram" class="tab">Diagram</div>
        <div id="tabMermaid" class="tab hidden">Mermaid</div>
        <div id="diagramTab"></div>
        <div id="mermaidTab" class="hidden"></div>
        <button id="zoomInBtn">+</button>
        <button id="zoomOutBtn">-</button>
        <button id="zoomResetBtn">Reset</button>
        <span id="zoomLevel">100%</span>
        <button id="panModeBtn">Pan Mode</button>
      </div>
      <div id="diagram" style="width: 1000px; height: 800px; position: relative;">
        <div id="nodes" style="position: absolute;"></div>
        <svg id="connections" style="position: absolute;"></svg>
      </div>
      <div id="loading" class="hidden">Loading...</div>
      <div id="status"></div>
      <div id="emptyState"></div>
      <div id="statsBar">
        <span id="totalFiles">0</span>
        <span id="totalDirs">0</span>
        <span id="totalLines">0</span>
        <span id="repoSize">0 B</span>
      </div>
      <div id="mermaidEditor"></div>
      <div id="mermaidPreview"></div>
      <button id="insertGraphBtn">Graph</button>
      <button id="insertFlowchartBtn">Flowchart</button>
      <button id="insertSequenceBtn">Sequence</button>
      <button id="clearEditorBtn">Clear</button>
      <button id="exportMermaidPNGBtn">Export PNG</button>
    </div>
  `;
};

describe('RepoDiagram Integration', () => {
  let app;

  beforeEach(() => {
    setupDOM();
    // Mock fetch for GitHub API
    global.fetch = jest.fn();
    app = new RepoDiagram();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should initialize UI elements correctly', () => {
    expect(app.repoInput).toBeTruthy();
    expect(app.loadBtn).toBeTruthy();
    expect(app.diagram).toBeTruthy();
    expect(app.nodesContainer).toBeTruthy();
    expect(app.connectionsSvg).toBeTruthy();
  });

  test('should show loading state when loading repo', async () => {
    // Mock fetch to delay response
    global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    app.repoInput.value = 'test/repo';
    fireEvent.click(app.loadBtn);
    
    expect(app.loading.classList.contains('hidden')).toBe(false);
    expect(app.loadBtn.disabled).toBe(true);
  });

  test('should display error status on load failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    
    app.repoInput.value = 'test/repo';
    fireEvent.click(app.loadBtn);
    
    await waitFor(() => {
      expect(app.status.textContent).toContain('Failed to load repository');
    });
  });

  test('should update depth selection and re-render', () => {
    // Setup mock data
    app.repoData = {
      name: 'test',
      type: 'tree',
      path: '',
      children: [
        { name: 'file.js', type: 'blob', path: 'file.js', size: 100 }
      ]
    };
    app.expanded.add('root');
    
    // Change depth
    fireEvent.change(app.depthSelect, { target: { value: '3' } });
    expect(app.maxDepth).toBe(3);
    
    // Render should be called (we can't easily test render output without more setup)
    // But we can verify the state change
    expect(app.maxDepth).toBe(3);
  });

  test('should filter nodes based on search query', () => {
    app.repoData = {
      name: 'test',
      type: 'tree',
      path: '',
      children: [
        { name: 'index.js', type: 'blob', path: 'index.js', size: 100 },
        { name: 'styles.css', type: 'blob', path: 'styles.css', size: 50 },
        { name: 'app.js', type: 'blob', path: 'app.js', size: 150 }
      ]
    };
    app.expanded.add('root');
    
    // Search for 'js'
    app.searchQuery = 'js';
    app.render();
    
    const nodes = app.nodesContainer.querySelectorAll('.node');
    expect(nodes.length).toBeGreaterThan(0);
    
    // Verify search highlight is applied
    const highlightedNodes = app.nodesContainer.querySelectorAll('.search-highlight');
    expect(highlightedNodes.length).toBeGreaterThan(0);
  });

  test('should toggle dark mode correctly', () => {
    const initialDark = document.body.classList.contains('dark');
    fireEvent.click(app.darkModeBtn);
    expect(document.body.classList.contains('dark')).toBe(!initialDark);
  });

  test('should handle zoom controls', () => {
    const initialZoom = app.zoom;
    
    fireEvent.click(app.zoomInBtn);
    expect(app.zoom).toBeGreaterThan(initialZoom);
    
    fireEvent.click(app.zoomOutBtn);
    expect(app.zoom).toBeLessThan(initialZoom + 0.1);
    
    fireEvent.click(app.zoomResetBtn);
    expect(app.zoom).toBe(1);
    expect(app.panX).toBe(0);
    expect(app.panY).toBe(0);
  });

  test('should toggle pan mode', () => {
    expect(app.isPanMode).toBe(false);
    fireEvent.click(app.panModeBtn);
    expect(app.isPanMode).toBe(true);
    fireEvent.click(app.panModeBtn);
    expect(app.isPanMode).toBe(false);
  });

  test('should switch tabs correctly', () => {
    expect(app.currentTab).toBe('diagram');
    expect(app.diagramTab.classList.contains('hidden')).toBe(false);
    expect(app.mermaidTab.classList.contains('hidden')).toBe(true);
    
    fireEvent.click(app.tabMermaid);
    
    expect(app.currentTab).toBe('mermaid');
    expect(app.diagramTab.classList.contains('hidden')).toBe(true);
    expect(app.mermaidTab.classList.contains('hidden')).toBe(false);
  });

  test('should update stats correctly', () => {
    const mockData = {
      children: [
        { type: 'blob', size: 1000, children: null },
        { type: 'blob', size: 2000, children: null },
        { type: 'tree', size: 0, children: [
          { type: 'blob', size: 500, children: null }
        ]}
      ]
    };
    
    app.updateStats(mockData);
    
    expect(app.repoStats.files).toBe(3);
    expect(app.repoStats.dirs).toBe(2);
    expect(app.repoStats.size).toBe(3500);
    
    const totalFilesEl = document.getElementById('totalFiles');
    expect(totalFilesEl.textContent).toBe('3');
  });

  test('should calculate repository depth', () => {
    const mockData = {
      children: [
        { type: 'tree', children: [
          { type: 'tree', children: [
            { type: 'blob', children: null }
          ]}
        ]}
      ]
    };
    
    app.calculateRepoDepth(mockData);
    expect(app.maxRepoDepth).toBe(3);
  });

  test('should generate Mermaid code correctly', () => {
    app.repoData = {
      name: 'test-repo',
      type: 'tree',
      path: '',
      children: [
        { name: 'index.js', type: 'blob', path: 'index.js', size: 100 },
        { name: 'src', type: 'tree', path: 'src', children: [
          { name: 'components', type: 'tree', path: 'src/components', children: [
            { name: 'Button.jsx', type: 'blob', path: 'src/components/Button.jsx', size: 200 }
          ]}
        ]}
      ]
    };
    app.expanded.add('root');
    app.expanded.add('src');
    app.expanded.add('src/components');
    app.maxDepth = 3;
    
    const mermaidCode = app.generateMermaidCode();
    
    expect(mermaidCode).toContain('graph TD');
    expect(mermaidCode).toContain('index.js');
    expect(mermaidCode).toContain('src');
    expect(mermaidCode).toContain('components');
  });

  test('should handle keyboard navigation', () => {
    app.repoData = {
      name: 'test',
      type: 'tree',
      path: '',
      children: [
        { name: 'file1.js', type: 'blob', path: 'file1.js', size: 100 },
        { name: 'file2.js', type: 'blob', path: 'file2.js', size: 100 }
      ]
    };
    app.expanded.add('root');
    app.render();
    
    // Focus first node
    const nodes = app.nodesContainer.querySelectorAll('.node');
    nodes[0].focus();
    expect(app.focusedNode).toBe(nodes[0]);
    
    // Simulate arrow down
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(app.focusedNode).toBe(nodes[1]);
    
    // Simulate Enter to click
    const clickHandler = nodes[1].onclick;
    fireEvent.keyDown(document, { key: 'Enter' });
    // The click should have been triggered
  });
});
