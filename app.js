// Repo Diagram - Interactive Mermaid Editor

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    },
    sequence: {
        useMaxWidth: true
    },
    gantt: {
        useMaxWidth: true
    }
});

// DOM Elements
const mermaidInput = document.getElementById('mermaidInput');
const diagramPreview = document.getElementById('diagramPreview');
const renderBtn = document.getElementById('renderBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const exampleButtons = document.querySelectorAll('.exampleBtn');

// Default example code
const defaultExample = `graph TD
    A[Repository Root] --> B[src/]
    A --> C[docs/]
    A --> D[README.md]
    B --> E[main.go]
    B --> F[handlers/]
    B --> G[models/]
    B --> H[utils/]
    F --> I[auth.go]
    F --> J[user.go]
    G --> K[user.go]
    G --> L[post.go]
    E --> M[Initialize]
    E --> N[Routes]
    I --> O[Login]
    J --> P[Profile]`;

// Set default example on load
window.addEventListener('DOMContentLoaded', () => {
    mermaidInput.value = defaultExample;
    renderDiagram();
});

// Render diagram function
async function renderDiagram() {
    const code = mermaidInput.value.trim();
    
    if (!code) {
        diagramPreview.innerHTML = `
            <div class="text-gray-400 text-center">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"/>
                </svg>
                <p>Your diagram will appear here</p>
                <p class="text-sm mt-2">Write Mermaid code and click "Render Diagram"</p>
            </div>
        `;
        return;
    }

    // Generate unique ID for this render
    const id = 'mermaid-' + Date.now();
    
    try {
        // Check if code is valid Mermaid syntax
        const { svg } = await mermaid.render(id, code);
        diagramPreview.innerHTML = svg;
    } catch (error) {
        console.error('Mermaid render error:', error);
        diagramPreview.innerHTML = `
            <div class="text-red-400 text-center p-4">
                <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="font-medium">Error rendering diagram</p>
                <p class="text-sm mt-2 text-red-300">${error.message}</p>
                <p class="text-xs mt-3 text-gray-400">Check your Mermaid syntax and try again.</p>
            </div>
        `;
    }
}

// Event Listeners
renderBtn.addEventListener('click', renderDiagram);

clearBtn.addEventListener('click', () => {
    mermaidInput.value = '';
    diagramPreview.innerHTML = `
        <div class="text-gray-400 text-center">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"/>
            </svg>
            <p>Your diagram will appear here</p>
            <p class="text-sm mt-2">Write Mermaid code and click "Render Diagram"</p>
        </div>
    `;
    mermaidInput.focus();
});

// File upload handler
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    fileName.textContent = file.name;
    
    try {
        const text = await file.text();
        mermaidInput.value = text;
        await renderDiagram();
    } catch (error) {
        console.error('File read error:', error);
        alert('Failed to read file. Please try again.');
    }
});

// Example buttons
exampleButtons.forEach(button => {
    button.addEventListener('click', () => {
        const code = button.getAttribute('data-code');
        mermaidInput.value = code;
        renderDiagram();
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter to render
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        renderDiagram();
    }
    
    // Escape to clear
    if (e.key === 'Escape' && document.activeElement === mermaidInput) {
        e.preventDefault();
        clearBtn.click();
    }
});

// Export functions for potential future use
window.repoDiagram = {
    render: renderDiagram,
    clear: () => clearBtn.click(),
    setCode: (code) => { mermaidInput.value = code; },
    getCode: () => mermaidInput.value
};