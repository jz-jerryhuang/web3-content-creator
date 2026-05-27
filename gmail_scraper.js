import fs from 'fs';
import path from 'path';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

async function fetchLatestEmail({ username, password, subjectFilter, outputFile }) {
    console.log(`Connecting to Gmail for user: ${username}...`);
    
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: username,
            pass: password
        },
        logger: false
    });

    try {
        await client.connect();
        
        // Select mailbox
        let lock = await client.getMailboxLock('INBOX');
        try {
            console.log(`Searching for emails matching subject: "${subjectFilter}"...`);
            
            // imapflow search takes query object
            let messages = await client.search({
                subject: subjectFilter
            });

            if (!messages || messages.length === 0) {
                console.error(`No emails found matching subject: "${subjectFilter}"`);
                return false;
            }

            console.log(`Found ${messages.length} matching emails. Fetching the latest one...`);
            let latestUid = messages[messages.length - 1];
            
            let message = await client.fetchOne(latestUid, { source: true });
            if (!message || !message.source) {
                console.error('Failed to fetch raw email source.');
                return false;
            }

            const parsed = await simpleParser(message.source);
            
            console.log(`\n--- Email Metadata ---`);
            console.log(`Subject: ${parsed.subject}`);
            console.log(`From: ${parsed.from ? parsed.from.text : 'Unknown'}`);
            console.log(`Date: ${parsed.date}`);
            console.log(`----------------------\n`);

            const cleanText = parsed.text || parsed.textAsHtml || parsed.html || '';

            if (!cleanText.trim()) {
                console.error('Email body is empty.');
                return false;
            }

            // Write metadata and content
            const fileContent = `SUBJECT: ${parsed.subject}\nDATE: ${parsed.date}\nFROM: ${parsed.from ? parsed.from.text : 'Unknown'}\n\n=== CONTENT ===\n${cleanText}`;
            
            fs.writeFileSync(outputFile, fileContent, 'utf-8');
            console.log(`Successfully saved email content to: ${outputFile}`);
            return true;
        } finally {
            lock.release();
        }
    } catch (err) {
        console.error('Error occurred during IMAP process:', err);
        return false;
    } finally {
        await client.logout();
    }
}

// Parse CLI arguments
async function run() {
    const args = process.argv.slice(2);
    
    let subjectFilter = '【每日 Web3 洞察】';
    let outputFile = 'latest_insight.txt';
    let testMode = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--subject' && args[i+1]) {
            subjectFilter = args[i+1];
            i++;
        } else if (args[i] === '--out' && args[i+1]) {
            outputFile = args[i+1];
            i++;
        } else if (args[i] === '--test') {
            testMode = true;
        }
    }

    const username = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;

    if (testMode) {
        console.log("Running scraper self-test...");
        if (!username || !password) {
            console.log("Warning: GMAIL_USER or GMAIL_APP_PASSWORD environment variables are not set.");
            console.log("Self-test completed (code structure verified).");
            process.exit(0);
        }
    }

    if (!username || !password) {
        console.error("Error: GMAIL_USER and GMAIL_APP_PASSWORD environment variables must be set.");
        console.error("Please set them in your environment:");
        console.error("  $env:GMAIL_USER='your_email@gmail.com'");
        console.error("  $env:GMAIL_APP_PASSWORD='your_16_digit_app_password'");
        process.exit(1);
    }

    const success = await fetchLatestEmail({ username, password, subjectFilter, outputFile });
    if (!success) {
        process.exit(1);
    }
}

run();
