/**
 * End-to-End Tests with Puppeteer
 */

const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../app.js');

describe('RepoDiagram E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('PAGE ERROR:', msg.text());
      }
    });
    
    // Listen for unhandled exceptions
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });
  });

  afterEach(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  test('should load and display the application', async () => {
    // Serve the HTML file locally
    await page.goto(`file://${HTML_PATH}`);
    
    // Wait for app to initialize
    await page.waitForFunction(() => window.app !== undefined);
    
    // Check key elements are present
    const appExists = await page.evaluate(() => !!window.app);
    expect(appExists).toBe(true);
    
    const repoInput = await page.$('#repoInput');
    expect(repoInput).not.toBeNull();
    
    const loadBtn = await page.$('#loadBtn');
    expect(loadBtn).not.toBeNull();
  });

  test('should handle repository loading with mock API', async () => {
    // Create a simple HTTP server to serve test data
    const http = require('http');
    const server = http.createServer(async (req, res) => {
      if (req.url.includes('/repos/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          tree: [
            { path: 'README.md', type: 'blob', size: 1024, mode: '100644' },
            { path: 'src', type: 'tree', size: 0, mode: '040000' },
            { path: 'src/index.js', type: 'blob', size: 2048, mode: '100644' },
            { path: 'src/utils', type: 'tree', size: 0, mode: '040000' },
            { path: 'src/utils/helper.js', type: 'blob', size: 512, mode: '100644' },
          ]
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    await new Promise(resolve => server.listen(3456, resolve));
    
    try {
      // Navigate to page
      await page.goto('http://localhost:3456/test-fixture.html');
      
      // Wait for app
      await page.waitForFunction(() => window.app !== undefined);
      
      // Intercept fetch to use our mock server
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = request.url();
        if (url.includes('api.github.com')) {
          request.continue({
            url: url.replace('api.github.com', 'localhost:3456')
          });
        } else {
          request.continue();
        }
      });
      
      // Enter repo and load
      await page.type('#repoInput', 'testowner/testrepo');
      await page.click('#loadBtn');
      
      // Wait for loading to complete
      await page.waitForFunction(() => {
        const app = window.app;
        return app && app.repoData && !app.loading.classList.contains('hidden') === false;
      }, { timeout: 10000 });
      
      // Check that nodes were created
      const nodeCount = await page.evaluate(() => {
        const app = window.app;
        return app ? app.nodesContainer.querySelectorAll('.node').length : 0;
      });
      
      expect(nodeCount).toBeGreaterThan(0);
      
      // Check stats are updated
      const totalFiles = await page.$eval('#totalFiles', el => el.textContent);
      expect(parseInt(totalFiles)).toBeGreaterThan(0);
      
    } finally {
      server.close();
    }
  });

  test('should toggle dark mode', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Check initial state (light mode)
    const isDarkInitially = await page.evaluate(() => 
      document.body.classList.contains('dark')
    );
    expect(isDarkInitially).toBe(false);
    
    // Click dark mode button
    await page.click('#darkModeBtn');
    
    // Check dark mode is active
    const isDarkAfter = await page.evaluate(() => 
      document.body.classList.contains('dark')
    );
    expect(isDarkAfter).toBe(true);
    
    // Click again to toggle back
    await page.click('#darkModeBtn');
    const isDarkAgain = await page.evaluate(() => 
      document.body.classList.contains('dark')
    );
    expect(isDarkAgain).toBe(false);
  });

  test('should handle zoom controls', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Get initial zoom
    const initialZoom = await page.evaluate(() => window.app.zoom);
    
    // Click zoom in
    await page.click('#zoomInBtn');
    const zoomAfterIn = await page.evaluate(() => window.app.zoom);
    expect(zoomAfterIn).toBeGreaterThan(initialZoom);
    
    // Click zoom out
    await page.click('#zoomOutBtn');
    const zoomAfterOut = await page.evaluate(() => window.app.zoom);
    expect(zoomAfterOut).toBeLessThan(zoomAfterIn);
    
    // Click reset
    await page.click('#zoomResetBtn');
    const zoomAfterReset = await page.evaluate(() => window.app.zoom);
    expect(zoomAfterReset).toBe(1);
  });

  test('should switch between diagram and mermaid tabs', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Initially on diagram tab
    let currentTab = await page.evaluate(() => window.app.currentTab);
    expect(currentTab).toBe('diagram');
    
    const diagramTabVisible = await page.$eval('#diagramTab', el => 
      !el.classList.contains('hidden')
    );
    expect(diagramTabVisible).toBe(true);
    
    const mermaidTabVisible = await page.$eval('#mermaidTab', el => 
      el.classList.contains('hidden')
    );
    expect(mermaidTabVisible).toBe(true);
    
    // Click mermaid tab
    await page.click('#tabMermaid');
    
    currentTab = await page.evaluate(() => window.app.currentTab);
    expect(currentTab).toBe('mermaid');
    
    diagramTabVisible = await page.$eval('#diagramTab', el => 
      el.classList.contains('hidden')
    );
    expect(diagramTabVisible).toBe(true);
    
    mermaidTabVisible = await page.$eval('#mermaidTab', el => 
      !el.classList.contains('hidden')
    );
    expect(mermaidTabVisible).toBe(true);
  });

  test('should handle search filtering', async () => {
    // First load some data
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Manually set repoData
    await page.evaluate(() => {
      window.app.repoData = {
        name: 'test',
        type: 'tree',
        path: '',
        children: [
          { name: 'index.js', type: 'blob', path: 'index.js', size: 100 },
          { name: 'styles.css', type: 'blob', path: 'styles.css', size: 50 },
          { name: 'app.js', type: 'blob', path: 'app.js', size: 150 }
        ]
      };
      window.app.expanded.add('root');
      window.app.render();
    });
    
    // Get initial node count
    const initialCount = await page.evaluate(() => 
      window.app.nodesContainer.querySelectorAll('.node').length
    );
    expect(initialCount).toBe(3);
    
    // Type in search
    await page.type('#searchInput', 'js');
    
    // Wait for debounce and render
    await page.waitForTimeout(600);
    
    const filteredCount = await page.evaluate(() => 
      window.app.nodesContainer.querySelectorAll('.node').length
    );
    // Should still show all nodes (parents included) but with highlights
    expect(filteredCount).toBeGreaterThan(0);
    
    // Check for highlighted text
    const highlighted = await page.evaluate(() => 
      document.querySelectorAll('.search-highlight').length
    );
    expect(highlighted).toBeGreaterThan(0);
  });

  test('should expand and collapse directories', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Setup nested data
    await page.evaluate(() => {
      window.app.repoData = {
        name: 'test',
        type: 'tree',
        path: '',
        children: [
          { 
            name: 'src', 
            type: 'tree', 
            path: 'src', 
            children: [
              { name: 'index.js', type: 'blob', path: 'src/index.js', size: 100 }
            ] 
          }
        ]
      };
      window.app.expanded.add('root');
      window.app.render();
    });
    
    // Initially src is not expanded (only root is)
    let nodeCount = await page.evaluate(() => 
      window.app.nodesContainer.querySelectorAll('.node').length
    );
    expect(nodeCount).toBe(2); // root + src
    
    // Click on src node to expand
    const srcNode = await page.$('.node[data-path="src"]');
    await srcNode.click();
    
    // Wait for render
    await page.waitForTimeout(100);
    
    nodeCount = await page.evaluate(() => 
      window.app.nodesContainer.querySelectorAll('.node').length
    );
    expect(nodeCount).toBe(3); // root + src + index.js
    
    // Click collapse all
    await page.click('#collapseAllBtn');
    
    nodeCount = await page.evaluate(() => 
      window.app.nodesContainer.querySelectorAll('.node').length
    );
    expect(nodeCount).toBe(1); // only root
  });

  test('should create file info modal on file click', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Setup data with a file
    await page.evaluate(() => {
      window.app.repoData = {
        name: 'test',
        type: 'tree',
        path: '',
        children: [
          { name: 'README.md', type: 'blob', path: 'README.md', size: 1024 }
        ]
      };
      window.app.expanded.add('root');
      window.app.render();
    });
    
    // Click on file node
    const fileNode = await page.$('.node[data-path="README.md"]');
    await fileNode.click();
    
    // Check modal appears
    const modal = await page.$('#fileInfoModal');
    expect(modal).not.toBeNull();
    
    const modalVisible = await page.$eval('#fileInfoModal', el => 
      !el.classList.contains('hidden')
    );
    expect(modalVisible).toBe(true);
    
    // Check modal content
    const modalContent = await page.$eval('#modalContent', el => el.innerHTML);
    expect(modalContent).toContain('README.md');
    expect(modalContent).toContain('1024');
  });

  test('should generate and export Mermaid code', async () => {
    await page.goto(`file://${HTML_PATH}`);
    await page.waitForFunction(() => window.app !== undefined);
    
    // Switch to Mermaid tab
    await page.click('#tabMermaid');
    
    // Check Mermaid editor exists
    const editorExists = await page.evaluate(() => !!window.app.mermaidCode);
    expect(editorExists).toBe(true);
    
    // Type some Mermaid code
    const mermaidCode = 'graph TD\n    A --> B';
    await page.evaluate((code) => {
      const editor = window.app.mermaidCode;
      if (editor.setValue) {
        editor.setValue(code);
      } else {
        editor.value = code;
      }
    }, mermaidCode);
    
    // Check preview updates
    await page.waitForTimeout(600);
    const preview = await page.$eval('#mermaidPreview', el => el.innerHTML);
    expect(preview).toContain('svg');
  });
});
