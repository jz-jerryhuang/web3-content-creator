import fs from 'fs';
import pdf from 'pdf-parse';

async function parsePdf(pdfPath, outPath) {
    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: File not found at: ${pdfPath}`);
        return false;
    }

    console.log(`Reading PDF: ${pdfPath}...`);
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        console.log(`Successfully parsed PDF!`);
        console.log(`Total Pages: ${data.numpages}`);

        const textResult = `--- PDF TEXT EXTRACTION ---\nFile: ${pdfPath}\nTotal Pages: ${data.numpages}\n\n=== CONTENT ===\n${data.text}`;

        if (outPath) {
            fs.writeFileSync(outPath, textResult, 'utf-8');
            console.log(`Saved text content to: ${outPath}`);
        } else {
            console.log('\nPreview of first 1000 characters:');
            console.log('-'.repeat(40));
            console.log(data.text.slice(0, 1000));
            console.log('-'.repeat(40));
        }
        return true;
    } catch (err) {
        console.error('Error occurred during PDF parsing:', err);
        return false;
    }
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: node pdf_parser.js <pdf_path> [--out <output_path>]");
        process.exit(1);
    }

    const pdfPath = args[0];
    let outPath = null;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--out' && args[i+1]) {
            outPath = args[i+1];
            i++;
        }
    }

    const success = await parsePdf(pdfPath, outPath);
    if (!success) {
        process.exit(1);
    }
}

run();
