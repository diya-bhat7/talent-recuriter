import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const OUTPUT_FILE = './DEVELOPER_DOCS.md';

const directoriesToScan = [
    'hooks',
    'services',
    'lib',
    'utils'
];

function extractDocs(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const docs = [];

    // Match JSDoc and following export function/const
    const regex = /\/\*\*([\s\S]*?)\*\/[\s\n]*export\s+(?:function|const)\s+([a-zA-Z0-9_]+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const comment = match[1].replace(/\n\s*\* ?/g, '\n').trim();
        const functionName = match[2];
        docs.push({ functionName, comment, fileName });
    }

    return docs;
}

function generateMarkdown() {
    let markdown = '# Developer Documentation\n\n';
    markdown += 'This document is automatically generated from JSDoc comments in the codebase.\n\n';

    directoriesToScan.forEach(dir => {
        const dirPath = path.join(SRC_DIR, dir);
        if (!fs.existsSync(dirPath)) return;

        markdown += `## ${dir.charAt(0).toUpperCase() + dir.slice(1)}\n\n`;

        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const docs = extractDocs(filePath);

            if (docs.length > 0) {
                markdown += `### [${file}](src/${dir}/${file})\n\n`;
                docs.forEach(doc => {
                    markdown += `#### \`${doc.functionName}\`\n\n`;
                    markdown += `${doc.comment}\n\n`;
                });
                markdown += '---\n\n';
            }
        });
    });

    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`Documentation generated at ${OUTPUT_FILE}`);
}

generateMarkdown();
