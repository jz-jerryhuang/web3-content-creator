#!/bin/bash
# Bash installation and update script for content-creator-plugin
REPO_URL="https://github.com/jz-jerryhuang/web3-content-creator.git"
PLUGIN_NAME="content-creator-plugin"
PLUGINS_DIR="$HOME/.gemini/config/plugins"
TARGET_DIR="$PLUGINS_DIR/$PLUGIN_NAME"

echo "========================================="
echo "🛠️ Web3 Content Creator Plugin Installer"
echo "========================================="

# Create plugins directory if it doesn't exist
mkdir -p "$PLUGINS_DIR"

# Clone or pull updates
if [ -d "$TARGET_DIR" ]; then
    echo "🔄 Updating content-creator-plugin at $TARGET_DIR..."
    cd "$TARGET_DIR" || exit
    git pull
    npm install
    echo "✅ Successfully updated!"
else
    echo "📥 Installing content-creator-plugin to $TARGET_DIR..."
    cd "$PLUGINS_DIR" || exit
    git clone "$REPO_URL" "$PLUGIN_NAME"
    cd "$TARGET_DIR" || exit
    npm install
    echo "✅ Successfully installed!"
fi
