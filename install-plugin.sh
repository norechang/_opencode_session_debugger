#!/bin/bash

# OpenCode Session Debugger - Easy Installation Script
# This script helps set up the plugin in your OpenCode project

set -e

echo "🔧 OpenCode Session Debugger - Installation Script"
echo ""

# Check if we're in a project directory
if [ ! -d ".opencode" ]; then
    echo "📁 .opencode directory not found. Creating it..."
    mkdir -p .opencode
fi

cd .opencode

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "📦 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "opencode-config",
  "version": "1.0.0",
  "private": true
}
EOF
    echo "✓ package.json created"
else
    echo "✓ package.json already exists"
fi

# Install the plugin
echo ""
echo "📥 Installing opencode-session-debugger..."
npm install opencode-session-debugger

# Create or update opencode.jsonc
if [ ! -f "opencode.jsonc" ] && [ ! -f "opencode.json" ]; then
    echo ""
    echo "⚙️  Creating opencode.jsonc configuration..."
    cat > opencode.jsonc << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
EOF
    echo "✓ Configuration created"
else
    echo ""
    echo "⚠️  Configuration file already exists. Please manually add:"
    echo '   "plugin": ["opencode-session-debugger"]'
    echo "   to your .opencode/opencode.jsonc or .opencode/opencode.json"
fi

cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Start OpenCode: opencode"
echo "  2. Use OpenCode normally"
echo ""
echo "Using the CLI tool:"
echo "  • From .opencode directory: cd .opencode && npx opencode-debug list"
echo "  • From project root: .opencode/node_modules/.bin/opencode-debug list"
echo "  • Or install globally: npm install -g opencode-session-debugger"
echo ""
echo "Examples:"
echo "  cd .opencode"
echo "  npx opencode-debug list"
echo "  npx opencode-debug analyze <session-id>"
echo ""
echo "For more information, see: https://github.com/norechang/_opencode_session_debugger#readme"
