# PowerShell installation and update script for content-creator-plugin
$repoUrl = "https://github.com/jz-jerryhuang/web3-content-creator.git"
$pluginName = "content-creator-plugin"
$pluginsDir = Join-Path $HOME ".gemini\config\plugins"
$targetDir = Join-Path $pluginsDir $pluginName

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "🛠️ Web3 Content Creator Plugin Installer" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# Create plugins directory if it doesn't exist
if (-not (Test-Path $pluginsDir)) {
    New-Item -ItemType Directory -Force -Path $pluginsDir | Out-Null
    Write-Host "Created plugins directory at $pluginsDir" -ForegroundColor Green
}

# Clone or pull updates
if (Test-Path $targetDir) {
    Write-Host "🔄 Updating content-creator-plugin at $targetDir..." -ForegroundColor Cyan
    cd $targetDir
    git pull
    npm install
    Write-Host "✅ Successfully updated!" -ForegroundColor Green
} else {
    Write-Host "📥 Installing content-creator-plugin to $targetDir..." -ForegroundColor Cyan
    cd $pluginsDir
    git clone $repoUrl $pluginName
    cd $targetDir
    npm install
    Write-Host "✅ Successfully installed!" -ForegroundColor Green
}
