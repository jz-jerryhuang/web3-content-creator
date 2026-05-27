import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    const ghPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
    
    console.log("=========================================");
    console.log("🛠️ GitHub Repository Creator helper");
    console.log("=========================================\n");

    // 1. Check if gh CLI is authenticated
    try {
        execSync(`"${ghPath}" auth status`, { stdio: 'ignore' });
        console.log("✅ Authenticated with GitHub CLI.");
    } catch {
        console.log("❌ You are not logged into GitHub CLI.");
        console.log("\nPlease run the following command in your PowerShell/CMD window first to authenticate:");
        console.log("\n   gh auth login\n");
        console.log("Follow the interactive prompts to log in via browser. Once logged in, run this helper again.\n");
        rl.close();
        process.exit(1);
    }

    // 2. Ask for repository name
    const defaultRepoName = 'web3-content-creator-assets';
    let repoName = await askQuestion(`🏷️ Enter a name for your new GitHub repository (default: ${defaultRepoName}): `);
    if (!repoName) repoName = defaultRepoName;

    // 3. Create the repo and link it
    console.log(`\n🚀 Creating GitHub repository "${repoName}"...`);
    try {
        const workingDir = path.resolve('.');
        
        // Initialize git if not done
        if (!fs.existsSync(path.join(workingDir, '.git'))) {
            execSync('git init', { cwd: workingDir, stdio: 'inherit' });
            execSync('git branch -M main', { cwd: workingDir, stdio: 'inherit' });
        }

        // Run gh repo create
        execSync(`"${ghPath}" repo create "${repoName}" --public --source=. --remote=origin --push`, { cwd: workingDir, stdio: 'inherit' });
        
        console.log(`\n🎉 Repository "${repoName}" created and successfully pushed to GitHub!`);
    } catch (err) {
        console.error("\n❌ Failed to create or push repository.");
        console.error(err.message);
    }

    rl.close();
}

main();
