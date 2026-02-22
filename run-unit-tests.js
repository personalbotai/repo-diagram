#!/usr/bin/env node

/**
 * Simple Unit Test Runner for RepoDiagram
 * Runs unit tests without requiring full browser environment
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

function runUnitTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('RUNNING UNIT TESTS', 'bright');
  log('='.repeat(60) + '\n', 'cyan');
  
  return runCommand('npm run test:unit', 'Unit Tests');
}

function generateReport(passed) {
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'bright');
  log('='.repeat(60) + '\n', 'cyan');
  
  if (passed) {
    log('All unit tests passed! 🎉', 'green');
    return 0;
  } else {
    log('Some unit tests failed. Please review the output above.', 'yellow');
    return 1;
  }
}

function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('REPO DIAGRAM - UNIT TEST RUNNER', 'bright');
  log('='.repeat(60), 'cyan');
  
  checkDependencies();
  
  if (!fs.existsSync('node_modules')) {
    if (!installDependencies()) {
      process.exit(1);
    }
  }
  
  const passed = runUnitTests();
  
  // Print coverage report location if available
  if (fs.existsSync('coverage/unit/index.html')) {
    log('\n📊 Coverage report available at: file://' + path.resolve('coverage/unit/index.html'), 'blue');
  }
  
  const exitCode = generateReport(passed);
  process.exit(exitCode);
}

main();
