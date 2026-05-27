import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Helper to run shell commands safely
function runCmd(cmd, cwd) {
    console.log(`> ${cmd}`);
    try {
        return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'inherit' });
    } catch (err) {
        console.error(`Command failed: ${cmd}`);
        throw err;
    }
}

async function main() {
    const workingDir = path.resolve('.');
    
    // Parse arguments
    const args = process.argv.slice(2);
    let repoUrl = process.env.GITHUB_REPO_URL;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--repo' && args[i+1]) {
            repoUrl = args[i+1];
            i++;
        }
    }

    if (!repoUrl) {
        // Try reading from a local config file or Git remote if already exists
        try {
            const existingRemote = execSync('git remote get-url origin', { cwd: workingDir, encoding: 'utf-8' }).trim();
            if (existingRemote) {
                repoUrl = existingRemote;
            }
        } catch {
            // Ignore error if git remote doesn't exist yet
        }
    }

    if (!repoUrl) {
        console.error('\n❌ Error: GitHub repository URL not specified.');
        console.error('Please set the GITHUB_REPO_URL environment variable or pass --repo <URL>.');
        console.error('Example: node scripts/publish.js --repo https://github.com/yourusername/your-repo.git\n');
        process.exit(1);
    }

    console.log(`\n📦 Initializing and configuring Git in: ${workingDir}`);

    // Check if git is initialized
    if (!fs.existsSync(path.join(workingDir, '.git'))) {
        console.log("Git repo not detected. Initializing...");
        runCmd('git init', workingDir);
        runCmd('git branch -M main', workingDir);
    }

    // Set/Update remote
    try {
        const currentRemote = execSync('git remote get-url origin', { cwd: workingDir, encoding: 'utf-8' }).trim();
        if (currentRemote !== repoUrl) {
            console.log(`Updating remote origin to: ${repoUrl}`);
            runCmd(`git remote set-url origin ${repoUrl}`, workingDir);
        }
    } catch {
        console.log(`Adding remote origin: ${repoUrl}`);
        runCmd(`git remote add origin ${repoUrl}`, workingDir);
    }

    // Add files to stage
    console.log("Staging files...");
    runCmd('git add .', workingDir);

    // Commit changes
    const dateStr = new Date().toISOString().slice(0, 10);
    const commitMsg = `Publish content package - ${dateStr}`;
    try {
        const status = execSync('git status --porcelain', { cwd: workingDir, encoding: 'utf-8' }).trim();
        if (!status) {
            console.log("✨ No changes to commit. Everything is up-to-date.");
            return;
        }
        runCmd(`git commit -m "${commitMsg}"`, workingDir);
    } catch (err) {
        console.log("Nothing to commit or commit failed.");
    }

    // Push changes
    console.log(`🚀 Pushing to main branch...`);
    try {
        runCmd('git push -u origin main', workingDir);
        console.log('✅ Successfully published to GitHub!');
    } catch (err) {
        console.warn('⚠️ Push failed. Retrying with --force...');
        runCmd('git push -u origin main --force', workingDir);
        console.log('✅ Successfully published to GitHub with force push!');
    }
}

main().catch(err => {
    console.error('❌ Publishing failed:', err);
    process.exit(1);
});
