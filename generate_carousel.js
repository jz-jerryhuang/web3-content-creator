import fs from 'fs';
import path from 'path';

// Helper function to call Gemini API using native fetch
async function callGemini(systemPrompt, userPrompt, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [
            {
                parts: [
                    { text: userPrompt }
                ]
            }
        ],
        systemInstruction: {
            parts: [
                { text: systemPrompt }
            ]
        },
        generationConfig: {
            temperature: 0.3
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errText}`);
    }
    
    const result = await response.json();
    if (
        result.candidates && 
        result.candidates[0] && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts[0]
    ) {
        return result.candidates[0].content.parts[0].text;
    } else {
        throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(result)}`);
    }
}

async function orchestrate({ sourceFile, outputFile, dryRun, type }) {
    console.log(`Loading configuration...`);
    const configPath = './agent_config.json';
    if (!fs.existsSync(configPath)) {
        console.error('Error: agent_config.json not found in the current directory.');
        return false;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    console.log(`Reading source file: ${sourceFile}...`);
    if (!fs.existsSync(sourceFile)) {
        console.error(`Error: Source file "${sourceFile}" not found.`);
        return false;
    }
    const rawInputText = fs.readFileSync(sourceFile, 'utf-8');

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!dryRun && !apiKey) {
        console.error("Error: GEMINI_API_KEY environment variable is not set.");
        console.error("Please set it in your shell environment, or run with --dry-run for testing.");
        return false;
    }

    if (dryRun) {
        console.log("\n=== DRY RUN MODE: Generating Mock Output ===");
        const mockDraft = `
# Canva Draft: Mock Web3 Stablecoin Analysis (DRY RUN)

## P1: Cover Slide
- Title (Banner): 穩定幣的信任終局
- Subtitle: 國家力量 vs 私人信用
- Handle: IG @on.chain.with.jerry
- Visual Metaphor Idea: A split graphic showing a traditional government vault on one side and a decentralized blockchain network on the other.
- Canva Search Keywords: government vault, blockchain network flat icon

## P2: The Friction
- Title: 為什麼穩定幣還沒全面普及？
- Bullets:
  * Gas fee 門檻過高，阻礙一般大眾使用。
  * 出入金通道不順暢，法幣合規摩擦力大。
  * 缺乏可審計的企業級隱私保護。

## P3: The Paradigm Shift
- Title: 穩定幣即服務（SCaaS）的崛起
- Bullets:
  * 金融機構不需自建，走向白牌金融服務。
  * 嵌入式支付重塑全球商務場景。
  * 合規成本轉化為最強的產業護城河。

## P4: Mechanics
- Title: SCaaS 的運作流程
- Bullets:
  * 步驟 1: 發行商託管美債與法幣資產。
  * 步驟 2: 透過 API 提供代幣發行與銷毀服務。
  * 步驟 3: 合規引擎即時過濾洗錢風險。

## P5: Case Study
- Title: Circle & Visa Direct 跨境支付
- Bullets:
  * Circle 作為全球美元穩定幣基礎設施。
  * Visa Direct 打通法幣與加密資產界線。
  * 重塑跨國商家即時清結算網路。

## P6: Strategic Tension
- Title: 國家監管 vs 去中心化效率
- Bullets:
  * 美元霸權藉由穩定幣完成數位擴張。
  * 地方自治保障創新，全球防套利。
  * 商業銀行存款流失，面臨去中介化挑戰。

## P7: Battleground Matrix
| 維度 | 拉鋸力量A (擁抱合規) | 拉鋸力量B (去中心化) | 未來預判 |
| :--- | :--- | :--- | :--- |
| **傳統銀行** | 帶來海量資金 (無保險存款) | 低成本存款流失 (削弱放貸) | 轉型 BaaS 2.0 賺取無風險手續費 |
| **穩定本質** | 需國家制度撐腰 (存款保險) | 私人貨幣天生脆弱 (易擠兌) | 公私融合，巨頭接入央行流動性 |
| **監管架構** | 全球統一防套利 (防跨國傳染) | 地方自治保創新 (百花齊放) | 合規成本成為最強護城河 |

## P8: Strategic Action Items
- **擁抱合規** -> 建立監管護城河，打通金融通道。
- **BaaS 轉型** -> 重塑資產管理基建，提供白牌服務。
- **深耕全球南方** -> 移動端錢包最後一哩路，撬動兆級商機。

IG @on.chain.with.jerry
`;
        fs.writeFileSync(outputFile, mockDraft.trim(), 'utf-8');
        console.log(`Mock draft written to: ${outputFile}`);
        return true;
    }

    try {
        if (type === 'linkedin') {
            console.log(`\n[Agent] LinkedIn Writer is generating long-form article in Jerry's style...`);
            const linkedinPrompt = config.agents.linkedin_writer.system_prompt;
            
            const userPrompt = `Input Source Email (containing "3. LinkedIn 長文骨架" and referenced news sources):\n${rawInputText}\n\nTask: Find the skeletons in the text. Select one of the skeletons under "3. LinkedIn 長文骨架" (ideally the AI Agent payments one, or the one with the most substance), read its structure and referenced news sources in the email, and write a complete, high-quality, long-form LinkedIn post adhering strictly to the brand guidelines, tone, heading prefixes, parenthetical comments, and fintech vocabulary defined in agent_config.json. Do not output anything other than the post itself.`;
            
            const finalDraft = await callGemini(linkedinPrompt, userPrompt, apiKey, model);
            fs.writeFileSync(outputFile, finalDraft.trim(), 'utf-8');
            console.log(`\nSuccess! LinkedIn article saved to: ${outputFile}`);
            return true;
        } else if (type === 'ig') {
            console.log(`\n[Agent] Instagram Writer is generating post caption...`);
            const igPrompt = config.agents.ig_writer.system_prompt;
            
            const userPrompt = `Source text / reference article:\n${rawInputText}\n\nTask: Read the source text. Write a punchy, mobile-optimized, spaced, and highly engaging Instagram caption with clean emojis, swipe cues, and appropriate hashtags at the bottom, following the guidelines in agent_config.json. Do not output anything other than the caption itself.`;
            
            const finalDraft = await callGemini(igPrompt, userPrompt, apiKey, model);
            fs.writeFileSync(outputFile, finalDraft.trim(), 'utf-8');
            console.log(`\nSuccess! Instagram post caption saved to: ${outputFile}`);
            return true;
        } else {
            // Step 1: Researcher Agent
            console.log(`\n[Agent 1/3] Researcher is analyzing raw text...`);
            const researcherPrompt = config.agents.researcher.system_prompt;
            const researchSynthesis = await callGemini(researcherPrompt, rawInputText, apiKey, model);
            console.log(`Researcher Synthesis completed! (Length: ${researchSynthesis.length})`);

            // Step 2: Outliner Agent
            console.log(`\n[Agent 2/3] Outliner is organizing content into slides...`);
            const outlinerPrompt = config.agents.outliner.system_prompt;
            const slideOutline = await callGemini(outlinerPrompt, researchSynthesis, apiKey, model);
            console.log(`Slide Outline completed! (Length: ${slideOutline.length})`);

            // Step 3: Copywriter Agent
            console.log(`\n[Agent 3/3] Copywriter is generating final Canva copy...`);
            const copywriterPrompt = config.agents.copywriter.system_prompt;
            // Feed both the outline and the brand details to the copywriter
            const userPromptForCopywriter = `Slide Outline:\n${slideOutline}\n\nAdditional Research Details (if helpful):\n${researchSynthesis}`;
            const finalDraft = await callGemini(copywriterPrompt, userPromptForCopywriter, apiKey, model);
            
            // Write out the final file
            fs.writeFileSync(outputFile, finalDraft.trim(), 'utf-8');
            console.log(`\nSuccess! Final copywriting draft saved to: ${outputFile}`);
            return true;
        }
    } catch (err) {
        console.error(`Orchestration failed:`, err);
        return false;
    }
}

async function run() {
    const args = process.argv.slice(2);
    
    let sourceFile = 'latest_insight.txt';
    let outputFile = '';
    let dryRun = false;
    let type = 'carousel';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--src' && args[i+1]) {
            sourceFile = args[i+1];
            i++;
        } else if (args[i] === '--out' && args[i+1]) {
            outputFile = args[i+1];
            i++;
        } else if (args[i] === '--dry-run') {
            dryRun = true;
        } else if (args[i] === '--type' && args[i+1]) {
            type = args[i+1];
            i++;
        }
    }

    if (!outputFile) {
        // Generate automatic output filename based on date and subject prefix
        const dateStr = new Date().toISOString().slice(0, 10);
        outputFile = type === 'linkedin' ? `draft_${dateStr}_linkedin.md` : (type === 'ig' ? `draft_${dateStr}_ig.md` : `draft_${dateStr}_carousel.md`);
    }

    // Ensure drafts directory exists if writing to one
    const dir = path.dirname(outputFile);
    if (dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const success = await orchestrate({ sourceFile, outputFile, dryRun, type });
    if (!success) {
        process.exit(1);
    }
}

run();
