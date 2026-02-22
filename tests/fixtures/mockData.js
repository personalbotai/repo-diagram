/**
 * Test Fixtures - Mock data for repository structures
 */

const MOCK_REPO_SMALL = {
  name: 'small-repo',
  type: 'tree',
  path: '',
  children: [
    { name: 'README.md', type: 'blob', size: 1024, mode: '100644', path: 'README.md' },
    { name: 'LICENSE', type: 'blob', size: 1139, mode: '100644', path: 'LICENSE' },
    { name: 'package.json', type: 'blob', size: 512, mode: '100644', path: 'package.json' },
    { name: 'src', type: 'tree', size: 0, mode: '040000', path: 'src', children: [
      { name: 'index.js', type: 'blob', size: 2048, mode: '100644', path: 'src/index.js' },
      { name: 'utils.js', type: 'blob', size: 1024, mode: '100644', path: 'src/utils.js' }
    ]},
    { name: 'tests', type: 'tree', size: 0, mode: '040000', path: 'tests', children: [
      { name: 'test.js', type: 'blob', size: 512, mode: '100644', path: 'tests/test.js' }
    ]}
  ]
};

const MOCK_REPO_MEDIUM = {
  name: 'medium-repo',
  type: 'tree',
  path: '',
  children: [
    { name: 'README.md', type: 'blob', size: 2048, mode: '100644', path: 'README.md' },
    { name: 'docs', type: 'tree', size: 0, mode: '040000', path: 'docs', children: [
      { name: 'getting-started.md', type: 'blob', size: 4096, mode: '100644', path: 'docs/getting-started.md' },
      { name: 'api.md', type: 'blob', size: 8192, mode: '100644', path: 'docs/api.md' },
      { name: 'examples', type: 'tree', size: 0, mode: '040000', path: 'docs/examples', children: [
        { name: 'basic.js', type: 'blob', size: 1024, mode: '100644', path: 'docs/examples/basic.js' },
        { name: 'advanced.js', type: 'blob', size: 2048, mode: '100644', path: 'docs/examples/advanced.js' }
      ]}
    ]},
    { name: 'src', type: 'tree', size: 0, mode: '040000', path: 'src', children: [
      { name: 'components', type: 'tree', size: 0, mode: '040000', path: 'src/components', children: [
        { name: 'Button.jsx', type: 'blob', size: 3072, mode: '100644', path: 'src/components/Button.jsx' },
        { name: 'Header.jsx', type: 'blob', size: 2560, mode: '100644', path: 'src/components/Header.jsx' },
        { name: 'Footer.jsx', type: 'blob', size: 2048, mode: '100644', path: 'src/components/Footer.jsx' }
      ]},
      { name: 'utils', type: 'tree', size: 0, mode: '040000', path: 'src/utils', children: [
        { name: 'format.js', type: 'blob', size: 1024, mode: '100644', path: 'src/utils/format.js' },
        { name: 'validate.js', type: 'blob', size: 1536, mode: '100644', path: 'src/utils/validate.js' },
        { name: 'api.js', type: 'blob', size: 4096, mode: '100644', path: 'src/utils/api.js' }
      ]},
      { name: 'App.js', type: 'blob', size: 8192, mode: '100644', path: 'src/App.js' },
      { name: 'index.js', type: 'blob', size: 512, mode: '100644', path: 'src/index.js' }
    ]},
    { name: 'public', type: 'tree', size: 0, mode: '040000', path: 'public', children: [
      { name: 'index.html', type: 'blob', size: 1024, mode: '100644', path: 'public/index.html' },
      { name: 'favicon.ico', type: 'blob', size: 1500, mode: '100644', path: 'public/favicon.ico' }
    ]},
    { name: 'tests', type: 'tree', size: 0, mode: '040000', path: 'tests', children: [
      { name: 'integration', type: 'tree', size: 0, mode: '040000', path: 'tests/integration', children: [
        { name: 'api.test.js', type: 'blob', size: 2048, mode: '100644', path: 'tests/integration/api.test.js' }
      ]},
      { name: 'unit', type: 'tree', size: 0, mode: '040000', path: 'tests/unit', children: [
        { name: 'utils.test.js', type: 'blob', size: 1024, mode: '100644', path: 'tests/unit/utils.test.js' }
      ]}
    ]}
  ]
};

const MOCK_GITHUB_API_RESPONSE = {
  sha: 'abc123',
  url: 'https://api.github.com/repos/owner/repo/git/trees/abc123',
  tree: [
    { path: 'README.md', mode: '100644', type: 'blob', size: 1024, sha: 'sha1' },
    { path: 'LICENSE', mode: '100644', type: 'blob', size: 1139, sha: 'sha2' },
    { path: 'src', mode: '040000', type: 'tree', size: 0, sha: 'sha3' },
    { path: 'src/index.js', mode: '100644', type: 'blob', size: 2048, sha: 'sha4' },
    { path: 'src/utils', mode: '040000', type: 'tree', size: 0, sha: 'sha5' },
    { path: 'src/utils/helper.js', mode: '100644', type: 'blob', size: 1024, sha: 'sha6' }
  ],
  truncated: false
};

const MOCK_BRANCHES_RESPONSE = [
  { name: 'main', commit: { sha: 'abc123', url: 'https://api.github.com/repos/owner/repo/commits/abc123' } },
  { name: 'master', commit: { sha: 'def456', url: 'https://api.github.com/repos/owner/repo/commits/def456' } },
  { name: 'develop', commit: { sha: 'ghi789', url: 'https://api.github.com/repos/owner/repo/commits/ghi789' } },
  { name: 'feature/new-ui', commit: { sha: 'jkl012', url: 'https://api.github.com/repos/owner/repo/commits/jkl012' } }
];

const FLAT_TREE_ITEMS = [
  { path: 'file1.txt', type: 'blob', size: 100, mode: '100644' },
  { path: 'file2.txt', type: 'blob', size: 200, mode: '100644' },
  { path: 'dir1', type: 'tree', size: 0, mode: '040000' },
  { path: 'dir1/file3.txt', type: 'blob', size: 300, mode: '100644' },
  { path: 'dir1/subdir', type: 'tree', size: 0, mode: '040000' },
  { path: 'dir1/subdir/file4.txt', type: 'blob', size: 400, mode: '100644' },
  { path: 'dir2', type: 'tree', size: 0, mode: '040000' },
  { path: 'dir2/file5.txt', type: 'blob', size: 500, mode: '100644' }
];

module.exports = {
  MOCK_REPO_SMALL,
  MOCK_REPO_MEDIUM,
  MOCK_GITHUB_API_RESPONSE,
  MOCK_BRANCHES_RESPONSE,
  FLAT_TREE_ITEMS
};
