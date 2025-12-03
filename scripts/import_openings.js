import fs from 'fs';
import path from 'path';
import { Chess } from 'chess.js';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENINGS_TXT_PATH = path.join(__dirname, '../data/openings.txt');
const EXISTING_OPENINGS_PATH = path.join(__dirname, '../data/openings.ts');
const OUTPUT_PATH = path.join(__dirname, '../data/additional_openings.ts');

// Regex to extract names from openings.ts
const extractExistingNames = (content) => {
    const names = new Set();
    const regex = /name:\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        names.add(match[1]);
    }
    return names;
};

// Regex to extract names from very_hard_openings.ts
const extractVeryHardNames = (content) => {
    const names = new Set();
    const regex = /"name":\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        names.add(match[1]);
    }
    return names;
};

async function main() {
    console.log('Reading files...');
    const openingsTxt = fs.readFileSync(OPENINGS_TXT_PATH, 'utf-8');

    let existingNames = new Set();

    if (fs.existsSync(EXISTING_OPENINGS_PATH)) {
        const content = fs.readFileSync(EXISTING_OPENINGS_PATH, 'utf-8');
        const names = extractExistingNames(content);
        names.forEach(n => existingNames.add(n));
    }

    const VERY_HARD_PATH = path.join(__dirname, '../data/very_hard_openings.ts');
    if (fs.existsSync(VERY_HARD_PATH)) {
        const content = fs.readFileSync(VERY_HARD_PATH, 'utf-8');
        const names = extractVeryHardNames(content);
        names.forEach(n => existingNames.add(n));
    }

    console.log(`Found ${existingNames.size} existing openings.`);

    const lines = openingsTxt.split('\n');
    const newOpenings = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split('\t');
        if (parts.length < 4) continue;

        const movesStr = parts[1].trim();
        const ecoPart = parts[2].trim();
        const name = parts[3].trim();

        if (name === 'Initial Setup') continue;
        if (existingNames.has(name)) continue;

        // Pre-processing:
        // 1. Remove variations in parentheses: "1 a4 b5 (2 axb5 Bb7)" -> "1 a4 b5 "
        let cleanMoves = movesStr.replace(/\s*\(.*$/, '');

        // 2. Replace 0-0-0 with O-O-O and 0-0 with O-O
        cleanMoves = cleanMoves.replace(/0-0-0/g, 'O-O-O').replace(/0-0/g, 'O-O');

        // 3. Remove move numbers. 
        // Match "1. ", "1.", "1 ", etc. at start or after space.
        // Also handle cases where there might be no space like "1.e4"
        cleanMoves = cleanMoves.replace(/(^|\s)\d+\.?\s*/g, ' ');

        // 4. Normalize spaces
        cleanMoves = cleanMoves.replace(/\s+/g, ' ').trim();

        const chess = new Chess();
        const moves = cleanMoves.split(' ');
        let valid = true;

        try {
            for (const move of moves) {
                if (!move) continue;
                const result = chess.move(move);
                if (!result) {
                    console.warn(`Error processing ${name}: Invalid move: "${move}"`);
                    console.warn(`Raw line: ${line}`);
                    console.warn(`Clean moves: "${cleanMoves}"`);
                    valid = false;
                    break;
                }
            }
        } catch (e) {
            console.warn(`Error processing ${name}: ${e.message}`);
            console.warn(`Raw line: ${line}`);
            valid = false;
        }

        if (valid) {
            const history = chess.history().join(' ');
            const fen = chess.fen();
            const eco = ecoPart.split(' ')[0];

            newOpenings.push({
                name,
                fen,
                moves: history,
                eco,
                difficulty: 'Very Hard'
            });
            existingNames.add(name);
        }
    }

    console.log(`Found ${newOpenings.length} new openings.`);

    const fileContent = `import { ChessOpening } from '../types';

export const ADDITIONAL_OPENINGS: ChessOpening[] = ${JSON.stringify(newOpenings, null, 2)};
`;

    fs.writeFileSync(OUTPUT_PATH, fileContent);
    console.log(`Written to ${OUTPUT_PATH}`);
}

main();
