#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all tests and generates a comprehensive report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runCommand(command, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running: ${description}`, 'bright');
  log(`${'='.repeat(60)}\n`, 'cyan');
  
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} passed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    return false;
  }
}

function checkDependencies() {
  log('\nChecking dependencies...', 'blue');
  
  const required = ['node', 'npm'];
  const missing = [];
  
  for (const cmd of required) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      log(`✓ ${cmd} is installed`, 'green');
    } catch {
      missing.push(cmd);
    }
  }
  
  if (missing.length > 0) {
    log(`\nMissing dependencies: ${missing.join(', ')}`, 'red');
    log('Please install them before running tests.', 'yellow');
    process.exit(1);
  }
}

function installDependencies() {
  log('\nInstalling npm dependencies...', 'blue');
  
  try {
    execSync('npm ci', { stdio: 'inherit' });
    log('✓ Dependencies installed successfully', 'green');
    return true;
  } catch (error) {
    log('✗ Failed to install dependencies', 'red');
    return false;
  }
}

function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('RUNNING ALL TESTS', 'bright');
  log('='.repeat(60) + '\n', 'cyan');
  
  const results = {
    unit: false,
    integration: false,
    e2e: false,
    coverage: false
  };
  
  // Unit tests
  results.unit = runCommand('npm run test:unit', 'Unit Tests');
  
  // Integration tests
  results.integration = runCommand('npm run test:integration', 'Integration Tests');
  
  // E2E tests (might fail in some environments, so we handle separately)
  log('\nNote: E2E tests require a display environment', 'yellow');
  results.e2e = runCommand('npm run test:e2e', 'End-to-End Tests');
  
  // Coverage
  results.coverage = runCommand('npm run test:coverage', 'Coverage Report (Unit)');
  
  return results;
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(60) + '\n', 'cyan');
  
  for (const [suite, passed] of Object.entries(results)) {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${suite.padEnd(20)} ${status}`, color);
  }
  
  const allPassed = Object.values(results).every(r => r);
  const somePassed = Object.values(results).some(r => r);
  
  log('\n' + '-'.repeat(60), 'cyan');
  
  if (allPassed) {
    log('All test suites passed! 🎉', 'green');
    return 0;
  } else if (somePassed) {
    log('Some test suites failed. Please review the output above.', 'yellow');
    return 1;
  } else {
    log('All test suites failed. Please check the setup.', 'red');
    return 2;
  }
}

function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('REPO DIAGRAM - AUTOMATED TEST SUITE', 'bright');
  log('='.repeat(60), 'cyan');
  
  checkDependencies();
  
  if (!fs.existsSync('node_modules')) {
    if (!installDependencies()) {
      process.exit(1);
    }
  }
  
  const results = runAllTests();
  const exitCode = generateReport(results);
  
  // Print coverage report location if available
  if (fs.existsSync('coverage/unit/index.html')) {
    log('\n📊 Coverage report available at: file://' + path.resolve('coverage/unit/index.html'), 'blue');
  }
  
  process.exit(exitCode);
}

main();
