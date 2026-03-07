#!/usr/bin/env node

// Post-build script to fix module.exports for Bun ESM compatibility
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.js');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add module.exports override at the end if not already there
  if (!content.includes('// CRITICAL: For Bun ESM import')) {
    content += `\n
// CRITICAL: For Bun ESM import of CommonJS modules
if (typeof module !== 'undefined') {
  module.exports = SessionDebuggerPlugin;
}
`;
    fs.writeFileSync(indexPath, content);
    console.log('✓ Fixed module.exports for Bun compatibility');
  }
}
