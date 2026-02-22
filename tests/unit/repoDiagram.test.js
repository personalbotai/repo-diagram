/**
 * Unit Tests for RepoDiagram Core Functions
 */

const {
  buildTree,
  formatSize,
  getFileExtension,
  getIconForFilename,
  countFiles,
  collectStats,
  calculateSmartDepth,
  escapeHtml,
  RepoDiagram
} = require('../../app.js');

// Helper to create mock GitHub tree item
const createTreeItem = (path, type = 'blob', size = 0, mode = '100644') => ({
  path,
  type,
  size,
  mode
});

describe('buildTree', () => {
  test('should create root node from empty path', () => {
    const treeData = [];
    const result = buildTree(treeData, 'owner/repo');
    
    expect(result).toHaveProperty('name', 'owner/repo');
    expect(result).toHaveProperty('type', 'tree');
    expect(result).toHaveProperty('path', '');
    expect(result).toHaveProperty('children', []);
  });

  test('should build simple flat structure', () => {
    const treeData = [
      createTreeItem('README.md', 'blob', 1024),
      createTreeItem('LICENSE', 'blob', 1000),
      createTreeItem('src/index.js', 'blob', 2048),
    ];
    
    const result = buildTree(treeData, 'test/repo');
    
    expect(result.children).toHaveLength(3);
    expect(result.children[0].name).toBe('README.md');
    expect(result.children[1].name).toBe('LICENSE');
    expect(result.children[2].name).toBe('src');
  });

  test('should handle nested directories', () => {
    const treeData = [
      createTreeItem('src/index.js', 'blob', 100),
      createTreeItem('src/utils/helper.js', 'blob', 200),
      createTreeItem('src/components/Button.jsx', 'blob', 300),
      createTreeItem('tests/unit/test.js', 'blob', 150),
    ];
    
    const result = buildTree(treeData, 'test/repo');
    
    const srcNode = result.children.find(c => c.name === 'src');
    expect(srcNode).toBeDefined();
    expect(srcNode.type).toBe('tree');
    expect(srcNode.children).toHaveLength(2);
    
    const utilsNode = srcNode.children.find(c => c.name === 'utils');
    expect(utilsNode).toBeDefined();
    expect(utilsNode.children[0].name).toBe('helper.js');
  });

  test('should calculate directory sizes recursively', () => {
    const treeData = [
      createTreeItem('dir1/file1.txt', 'blob', 500),
      createTreeItem('dir1/file2.txt', 'blob', 500),
      createTreeItem('dir2/file3.txt', 'blob', 1000),
    ];
    
    const result = buildTree(treeData, 'test/repo');
    
    const dir1 = result.children.find(c => c.name === 'dir1');
    const dir2 = result.children.find(c => c.name === 'dir2');
    
    expect(dir1.size).toBe(1000);
    expect(dir2.size).toBe(1000);
    expect(result.size).toBe(2000);
  });

  test('should sort directories before files', () => {
    const treeData = [
      createTreeItem('README.md', 'blob', 100),
      createTreeItem('src', 'tree', 0),
      createTreeItem('docs', 'tree', 0),
      createTreeItem('package.json', 'blob', 200),
    ];
    
    const result = buildTree(treeData, 'test/repo');
    
    // Directories should come first
    expect(result.children[0].type).toBe('tree');
    expect(result.children[1].type).toBe('tree');
    expect(result.children[2].type).toBe('blob');
    expect(result.children[3].type).toBe('blob');
  });

  test('should handle root directory', () => {
    const treeData = [
      createTreeItem('file.txt', 'blob', 100),
    ];
    
    const result = buildTree(treeData, 'my/repo');
    
    expect(result.name).toBe('my/repo');
    expect(result.path).toBe('');
    expect(result.children[0].path).toBe('file.txt');
  });
});

describe('formatSize', () => {
  test('should format bytes correctly', () => {
    expect(formatSize(500)).toBe('500 B');
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(1048576)).toBe('1.0 MB');
    expect(formatSize(1073741824)).toBe('1.0 GB');
  });

  test('should handle zero bytes', () => {
    expect(formatSize(0)).toBe('0 B');
  });
});

describe('getFileExtension', () => {
  test('should extract file extension', () => {
    expect(getFileExtension('index.js')).toBe('js');
    expect(getFileExtension('styles.css')).toBe('css');
    expect(getFileExtension('README.md')).toBe('md');
    expect(getFileExtension('config.json')).toBe('json');
  });

  test('should return empty string for files without extension', () => {
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('Dockerfile')).toBe('');
    expect(getFileExtension('LICENSE')).toBe('');
  });

  test('should handle multiple dots', () => {
    expect(getFileExtension('file.test.js')).toBe('js');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });
});

describe('getIconForFilename', () => {
  test('should return correct icon for known extensions', () => {
    expect(getIconForFilename({ name: 'index.js' })).toBe('🟨');
    expect(getIconForFilename({ name: 'main.ts' })).toBe('🔵');
    expect(getIconForFilename({ name: 'app.py' })).toBe('🐍');
    expect(getIconForFilename({ name: 'style.css' })).toBe('🎨');
    expect(getIconForFilename({ name: 'README.md' })).toBe('📖');
  });

  test('should return default icon for unknown extensions', () => {
    expect(getIconForFilename({ name: 'file.xyz' })).toBe('📄');
    expect(getIconForFilename({ name: 'unknown.abc' })).toBe('📄');
  });

  test('should return folder icon for directories', () => {
    expect(getIconForFilename({ name: 'src', type: 'tree' })).toBe('📁');
  });
});

describe('countFiles', () => {
  test('should count single file', () => {
    const file = { type: 'blob', children: null };
    expect(countFiles(file)).toBe(1);
  });

  test('should count files in directory recursively', () => {
    const dir = {
      type: 'tree',
      children: [
        { type: 'blob', children: null },
        { type: 'blob', children: null },
        {
          type: 'tree',
          children: [
            { type: 'blob', children: null },
            { type: 'blob', children: null },
          ]
        }
      ]
    };
    expect(countFiles(dir)).toBe(4);
  });

  test('should handle empty directory', () => {
    const emptyDir = { type: 'tree', children: [] };
    expect(countFiles(emptyDir)).toBe(0);
  });
});

describe('collectStats', () => {
  test('should collect basic statistics', () => {
    const repo = {
      type: 'tree',
      children: [
        { type: 'blob', size: 1000, children: null },
        { type: 'blob', size: 2000, children: null },
        {
          type: 'tree',
          size: 0,
          children: [
            { type: 'blob', size: 500, children: null },
            { type: 'blob', size: 1500, children: null },
          ]
        }
      ]
    };
    
    const stats = collectStats(repo);
    
    expect(stats.files).toBe(4);
    expect(stats.dirs).toBe(2); // root + nested dir
    expect(stats.size).toBe(4000);
    expect(stats.lines).toBeGreaterThan(0);
  });

  test('should handle empty repository', () => {
    const emptyRepo = { type: 'tree', children: [] };
    const stats = collectStats(emptyRepo);
    
    expect(stats.files).toBe(0);
    expect(stats.dirs).toBe(1);
    expect(stats.size).toBe(0);
    expect(stats.lines).toBe(0);
  });
});

describe('calculateSmartDepth', () => {
  test('should return depth 4 for small repos (<100 entries)', () => {
    const stats = { files: 50, dirs: 10 };
    expect(calculateSmartDepth(stats)).toBe(4);
  });

  test('should return depth 3 for medium repos (100-500 entries)', () => {
    const stats = { files: 300, dirs: 50 };
    expect(calculateSmartDepth(stats)).toBe(3);
  });

  test('should return depth 2 for large repos (500-2000 entries)', () => {
    const stats = { files: 1000, dirs: 200 };
    expect(calculateSmartDepth(stats)).toBe(2);
  });

  test('should return depth 1 for very large repos (>2000 entries)', () => {
    const stats = { files: 5000, dirs: 1000 };
    expect(calculateSmartDepth(stats)).toBe(1);
  });

  test('should return 2 for no stats', () => {
    expect(calculateSmartDepth(null)).toBe(2);
    expect(calculateSmartDepth(undefined)).toBe(2);
  });
});

describe('escapeHtml', () => {
  test('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('"quotes"')).toBe('"quotes"');
  });

  test('should handle normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('RepoDiagram Class Integration', () => {
  let RepoDiagram;
  let app;

  beforeAll(() => {
    // Load the app.js file dynamically
    const appCode = require('fs').readFileSync('./app.js', 'utf8');
    eval(appCode);
    RepoDiagram = window.RepoDiagram || global.RepoDiagram;
  });

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="repoInput"></div>
      <select id="branchSelect"></select>
      <button id="loadBtn"></button>
      <button id="expandAllBtn"></button>
      <button id="collapseAllBtn"></button>
      <button id="exportSVGBtn"></button>
      <button id="exportPNGBtn"></button>
      <input id="searchInput"></input>
      <select id="depthSelect"></select>
      <select id="layoutSelect"></select>
      <div id="diagram">
        <div id="nodes"></div>
        <svg id="connections"></svg>
      </div>
      <div id="loading" class="hidden"></div>
      <div id="status"></div>
      <div id="emptyState"></div>
      <div id="statsBar">
        <span id="totalFiles"></span>
        <span id="totalDirs"></span>
        <span id="totalLines"></span>
        <span id="repoSize"></span>
      </div>
      <button id="darkModeBtn"></button>
      <div id="controlsBg"></div>
      <button id="exportPDFBtn"></button>
      <button id="exportMermaidBtn"></button>
      <div id="tabDiagram"></div>
      <div id="tabMermaid"></div>
      <div id="diagramTab"></div>
      <div id="mermaidTab"></div>
      <div id="zoomInBtn"></div>
      <div id="zoomOutBtn"></div>
      <div id="zoomResetBtn"></div>
      <div id="zoomLevel"></div>
      <div id="panModeBtn"></div>
      <div id="mermaidEditor"></div>
      <div id="mermaidPreview"></div>
    `;
    
    app = new RepoDiagram();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    expect(app.repoData).toBeNull();
    expect(app.nodes.size).toBe(0);
    expect(app.expanded.size).toBe(0);
    expect(app.maxDepth).toBe(2);
    expect(app.zoom).toBe(1);
    expect(app.panX).toBe(0);
    expect(app.panY).toBe(0);
  });

  test('should cache data with timeout', () => {
    const testKey = 'test/repo';
    const testData = { name: 'test' };
    
    expect(app.getFromCache(testKey)).toBeNull();
    
    app.setInCache(testKey, testData);
    expect(app.getFromCache(testKey)).toEqual(testData);
    
    // Simulate cache expiration
    jest.useFakeTimers();
    app.cache.get(testKey).timestamp = Date.now() - 600000; // 10 minutes ago
    expect(app.getFromCache(testKey)).toBeNull();
    jest.useRealTimers();
  });

  test('should toggle directory expansion', () => {
    const mockNode = { path: 'test/path', type: 'tree', children: [] };
    
    expect(app.expanded.has('test/path')).toBe(false);
    app.expanded.add('test/path');
    expect(app.expanded.has('test/path')).toBe(true);
    app.expanded.delete('test/path');
    expect(app.expanded.has('test/path')).toBe(false);
  });

  test('should calculate layout correctly', () => {
    const mockRepo = {
      name: 'test',
      type: 'tree',
      path: '',
      children: [
        { name: 'file1.js', type: 'blob', path: 'file1.js', size: 100 },
        { name: 'dir1', type: 'tree', path: 'dir1', children: [] }
      ]
    };
    
    app.repoData = mockRepo;
    app.expanded.add('root');
    app.searchQuery = '';
    
    const containerWidth = 800;
    const layout = app.calculateLayout(mockRepo, containerWidth, 180, 120, 40);
    
    expect(layout.size).toBeGreaterThan(0);
    expect(layout.has('root')).toBe(true);
    expect(layout.has('file1.js')).toBe(true);
    expect(layout.has('dir1')).toBe(true);
  });

  test('should apply zoom and pan transform', () => {
    app.zoom = 1.5;
    app.panX = 50;
    app.panY = 30;
    
    app.applyTransform();
    
    expect(app.nodesContainer.style.transform).toBe('translate(50px, 30px) scale(1.5)');
    expect(app.connectionsSvg.style.transform).toBe('translate(50px, 30px) scale(1.5)');
  });

  test('should calculate export bounds', () => {
    const mockLayout = new Map([
      ['root', { x: 0, y: 0 }],
      ['file1', { x: 200, y: 100 }],
      ['dir1', { x: 200, y: 250 }]
    ]);
    
    app.calculateExportBounds(mockLayout, 180);
    
    expect(app.exportBounds).toBeDefined();
    expect(app.exportBounds.x).toBeLessThan(0); // padding applied
    expect(app.exportBounds.width).toBeGreaterThan(0);
    expect(app.exportBounds.height).toBeGreaterThan(0);
  });
});
