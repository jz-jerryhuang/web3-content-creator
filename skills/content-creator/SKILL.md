---
name: content-creator
description: Jerry's Web3 Content Creator. Guides you step-by-step to generate articles, carousel outlines, Canva CSVs, cover images, and upload them to GitHub.
---
# Content Creator Specialist

When the user starts a session with "use content-creator" or asks to run this skill:

1. **Greeting & Initialization**:
   - Greet the user: "Hi Jerry! Ready to create some content. Let's do this step-by-step. Please provide the source input (file path, raw text, or URL)."
   - Wait for the user to provide the source input.

2. **Step 1: Institutional/Market Research**:
   - Read the input source text or file content.
   - Analyze the raw input and extract the core substance:
     1. **Core Mechanics**: How does the system work? Transaction flows or architectural layers.
     2. **Problem Statement**: What friction in the existing financial system does this solve?
     3. **Sovereign/Institutional Implications**: Impact on central banks, commercial banks, payment networks, or USD hegemony.
     4. **Key Trade-offs**: Compare centralisation/decentralisation, regulation/innovation.
   - Output this structured summary in Traditional Chinese (Taiwanese localized terms).

3. **Step 2: LinkedIn Long-Form Post & QA Review**:
   - Write a complete long-form LinkedIn post based on the research.
   - **Constraints**:
     - Keep under **800 Chinese characters** (excluding reference links).
     - Start directly with a high-impact hook comparing numbers to create scale.
     - Section subheadings must start with `▌` or `▋`.
     - Strictly avoid overused transitional phrases like "這不(再)是...而是..." (only allow it for objective value comparisons).
     - Incorporate local Taiwanese fintech terms (e.g. 勾稽, 沖銷, 出入金, 原子結算).
     - Add witty parenthetical notes (e.g., 「（很現實）」, 「（本質是商業銀行貨幣）」).
   - **Internal QA Gatekeeper**:
     - Evaluate the draft against the rules and assign a score out of 100.
     - If the score is < 90, revise it until it passes.
   - Present the approved draft and score to the user, and wait for confirmation to proceed.

4. **Step 3: IG Carousel Outline & Canva Bulk Create CSV**:
   - Structure a 6-8 page slide-deck outline:
     - Slide 1: Hook Cover
     - Slide 2: The Core Problem
     - Slide 3: Paradigm Shift
     - Slide 4-5: Mechanics / Flow
     - Slide 6: Core Tension
     - Slide 7: Battleground Matrix Table
     - Slide 8: Future Trend Pills (3 short action statements)
   - Convert the outline into a Canva Bulk Create CSV block using these exact headers:
     `Page,Template_Type,Main_Title,Sub_Title,Content,Footer_Text,Design_Note`
   - Save the CSV as `canva_bulk_create.csv` in the article's dedicated folder.

5. **Step 4: Instagram Caption & QA Review**:
   - Write a mobile-optimized Instagram post caption based on the LinkedIn post and outline.
   - **Constraints**:
     - Start directly with a factual hook (no "💡 點開看本週解析" or similar).
     - Use concise, compact bullet points.
     - Avoid "這不是...而是...".
     - End with one genuine conversation-starting question. No generic CTAs like "建議收藏這篇".
   - Run the IG draft through the QA Gatekeeper. Revise if score < 90.
   - Save the approved IG caption as `instagram_caption.md` in the article's dedicated folder.

6. **Step 5: Automated Cover Image Generation**:
   - Deeply understand the core tension/metaphor of the topic.
   - Formulate a visual prompt for the `generate_image` tool:
     - Must be **NO TEXT, NO LETTERS, NO WORDS** (strictly visual).
     - Abstract, high-contrast, dark premium tech aesthetic.
   - Call `generate_image` to save the cover image as `cover_image.png` in the article's dedicated folder.

7. **Step 6: Package & Publish to GitHub**:
   - Run the publishing script (e.g. `node scripts/publish.js`) using the command tool to stage, commit, and push the newly generated content folder to the GitHub repository.
