import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Gemini Call Helper
async function callGemini(systemPrompt, userPrompt, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3 }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }
    
    const result = await response.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
    } else {
        throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(result)}`);
    }
}

async function runQAWorkflow(writerPrompt, writerUserPrompt, qaPrompt, apiKey, model, maxAttempts = 3) {
    let currentDraft = "";
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        attempt++;
        console.log(`Drafting content (Attempt ${attempt}/${maxAttempts})...`);
        const userPromptWithFeedback = attempt === 1 
            ? writerUserPrompt 
            : `${writerUserPrompt}\n\nPrevious draft:\n${currentDraft}\n\nPlease revise based on the following QA feedback:\n${qaFeedback}`;

        currentDraft = await callGemini(writerPrompt, userPromptWithFeedback, apiKey, model);
        
        console.log(`Running QA Review...`);
        const qaUserPrompt = `Evaluate the following draft:\n${currentDraft}\n\nProvide the score out of 100 first, followed by specific suggestions. Follow the system instruction.`;
        const qaResult = await callGemini(qaPrompt, qaUserPrompt, apiKey, model);
        
        // Extract score from QA result (e.g. searching for score or reading first few words)
        const scoreMatch = qaResult.match(/(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        
        console.log(`QA Score: ${score}/100`);
        
        if (score >= 90) {
            console.log(`🎉 QA Review Passed!`);
            return { draft: currentDraft, passed: true, score };
        }
        
        console.log(`⚠️ QA Review Failed (< 90). Feedback:\n${qaResult}\n`);
        var qaFeedback = qaResult;
    }
    
    console.log(`⚠️ Reached max QA revision attempts. Using last draft.`);
    return { draft: currentDraft, passed: false, score: 0 };
}

async function main() {
    console.log("=========================================");
    console.log("👋 Hi Jerry! Welcome to Content Creator CLI");
    console.log("=========================================\n");

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    if (!apiKey) {
        console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
        process.exit(1);
    }

    // Config loading
    const configPath = './agent_config.json';
    if (!fs.existsSync(configPath)) {
        console.error('❌ Error: agent_config.json not found in current directory.');
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Step 1: Input source file
    let sourceFile = await askQuestion("📁 Enter the path of the source file (default: latest_insight.txt): ");
    if (!sourceFile) sourceFile = "latest_insight.txt";

    if (!fs.existsSync(sourceFile)) {
        console.error(`❌ Error: File "${sourceFile}" not found.`);
        process.exit(1);
    }
    const rawInputText = fs.readFileSync(sourceFile, 'utf-8');

    // Step 2: Folder slug name
    let folderSlug = await askQuestion("🏷️ Enter topic slug for the output folder (e.g., bank_tokenization): ");
    if (!folderSlug) folderSlug = "new_topic";
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folderName = `drafts/${dateStr}_${folderSlug}`;
    const outputDir = path.resolve(folderName);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n📁 Target folder created at: ${folderName}`);

    // Step 3: Researcher Analysis
    console.log(`\n🔍 [Step 1/5] Analyzing raw text (Researcher)...`);
    const researchSynthesis = await callGemini(config.agents.researcher.system_prompt, rawInputText, apiKey, model);
    const researchFile = path.join(outputDir, "research.md");
    fs.writeFileSync(researchFile, researchSynthesis, 'utf-8');
    console.log(`✅ Research synthesis saved to: ${folderName}/research.md`);

    // Step 4: LinkedIn Post Generation + QA
    console.log(`\n✍️ [Step 2/5] Generating LinkedIn post (LinkedIn Writer & QA Reviewer)...`);
    const linkedinUserPrompt = `Research Details:\n${researchSynthesis}\n\nTask: Write a complete, high-quality, long-form LinkedIn post adhering strictly to the brand guidelines, tone, constraints, and vocabulary.`;
    const { draft: linkedinDraft, score: linkedinScore } = await runQAWorkflow(
        config.agents.linkedin_writer.system_prompt,
        linkedinUserPrompt,
        config.agents.qa_reviewer.system_prompt,
        apiKey,
        model
    );
    const linkedinFile = path.join(outputDir, "linkedin.md");
    fs.writeFileSync(linkedinFile, linkedinDraft, 'utf-8');
    console.log(`✅ LinkedIn post saved to: ${folderName}/linkedin.md (QA Score: ${linkedinScore})`);

    // Step 5: Canva CSV Generation
    console.log(`\n📊 [Step 3/5] Generating IG Carousel outline & Canva Bulk Create CSV (Outliner & Copywriter)...`);
    console.log("Creating Slide Outline...");
    const slideOutline = await callGemini(config.agents.outliner.system_prompt, researchSynthesis, apiKey, model);
    
    console.log("Creating Canva CSV...");
    const userPromptForCopywriter = `Slide Outline:\n${slideOutline}\n\nAdditional Research Details:\n${researchSynthesis}`;
    const csvDraft = await callGemini(config.agents.copywriter.system_prompt, userPromptForCopywriter, apiKey, model);
    const csvFile = path.join(outputDir, "canva_bulk_create.csv");
    
    // Clean up markdown block wraps if present
    const cleanedCsv = csvDraft.replace(/```csv/g, '').replace(/```/g, '').trim();
    fs.writeFileSync(csvFile, cleanedCsv, 'utf-8');
    console.log(`✅ Canva CSV saved to: ${folderName}/canva_bulk_create.csv`);

    // Step 6: Instagram Caption Generation + QA
    console.log(`\n📸 [Step 4/5] Generating Instagram caption (IG Writer & QA Reviewer)...`);
    const igUserPrompt = `Source text / reference article:\n${linkedinDraft}\n\nTask: Write a punchy, mobile-optimized Instagram post caption based on the LinkedIn post and the outline.`;
    const { draft: igDraft, score: igScore } = await runQAWorkflow(
        config.agents.ig_writer.system_prompt,
        igUserPrompt,
        config.agents.qa_reviewer.system_prompt,
        apiKey,
        model
    );
    const igFile = path.join(outputDir, "instagram_caption.md");
    fs.writeFileSync(igFile, igDraft, 'utf-8');
    console.log(`✅ Instagram caption saved to: ${folderName}/instagram_caption.md (QA Score: ${igScore})`);

    // Step 7: Visual Metaphor for Cover Image
    console.log(`\n🎨 [Step 5/5] Extracting visual metaphor for Cover Image...`);
    const visualMetaphorPrompt = `Read this topic detail: \n${researchSynthesis}\n\nExtract a visual metaphor and design a detailed prompt for an image generator. The image should be completely abstract, dark, high contrast, tech-focused, and MUST NOT contain any text, letters, or numbers. Provide only the prompt text itself.`;
    const visualMetaphor = await callGemini(config.agents.ig_writer.system_prompt, visualMetaphorPrompt, apiKey, model);
    const promptFile = path.join(outputDir, "cover_prompt.txt");
    fs.writeFileSync(promptFile, visualMetaphor, 'utf-8');
    console.log(`✅ Cover image prompt saved to: ${folderName}/cover_prompt.txt`);
    console.log(`\n🖼️ Visual Metaphor Prompt for Image Gen:\n"${visualMetaphor}"`);

    console.log("\n=========================================");
    console.log("🎉 Content creation step completed successfully!");
    console.log("=========================================\n");

    // Push to GitHub Prompt
    const publishAns = await askQuestion("🚀 Do you want to publish these changes to GitHub now? (y/n): ");
    if (publishAns.toLowerCase() === 'y' || publishAns.toLowerCase() === 'yes') {
        try {
            console.log("Running publisher script...");
            execSync('node scripts/publish.js', { stdio: 'inherit' });
        } catch (err) {
            console.error("❌ Failed to automatically push to GitHub.");
        }
    }

    rl.close();
}

main().catch(err => {
    console.error("❌ Fatal Error in CLI:", err);
    rl.close();
    process.exit(1);
});
