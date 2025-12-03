import fs from 'fs';
import path from 'path';
import { Chess } from 'chess.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDataPath = path.join(__dirname, '../data/raw_openings.txt');
const outputPath = path.join(__dirname, '../data/very_hard_openings.ts');

try {
    const data = fs.readFileSync(rawDataPath, 'utf8');
    const lines = data.split('\n');
    const openings = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Expected format: ID \t Moves \t ECO Explore \t Name
        const parts = line.split('\t');
        if (parts.length < 4) continue;

        const moveString = parts[1].trim(); // e.g., "1 a3 a5 2 b4"
        const ecoPart = parts[2].trim(); // e.g., "A00 Explore"
        const name = parts[3].trim(); // e.g., "Anderssen's Opening-Polish Gambit"

        // Clean moves: remove move numbers (1., 2, etc.) and extra spaces
        // Use word boundary \b to avoid matching digits inside moves (like a3, h3)
        // Also remove parentheses
        const cleanMoves = moveString
            .replace(/[()]/g, '') // Remove parentheses
            .replace(/0-0-0/g, 'O-O-O') // Replace 0-0-0 with O-O-O
            .replace(/0-0/g, 'O-O') // Replace 0-0 with O-O
            .replace(/\b\d+\.?\s+/g, '') // Remove move numbers like "1 " or "1. "
            .replace(/\s+/g, ' ')
            .trim();

        // Clean ECO
        const eco = ecoPart.split(' ')[0];

        // Generate FEN
        const chess = new Chess();
        const moves = cleanMoves.split(' ');
        let valid = true;
        for (const move of moves) {
            if (!move) continue;
            try {
                const result = chess.move(move);
                if (!result) {
                    console.error(`Invalid move ${move} in ${name}`);
                    valid = false;
                    break;
                }
            } catch (e) {
                console.error(`Error processing move ${move} in ${name}: ${e.message}`);
                valid = false;
                break;
            }
        }

        if (valid) {
            openings.push({
                name: name,
                fen: chess.fen(),
                moves: cleanMoves,
                eco: eco,
                difficulty: 'Very Hard'
            });
        }
    }

    const outputContent = `import { ChessOpening } from '../types';

export const VERY_HARD_OPENINGS: ChessOpening[] = ${JSON.stringify(openings, null, 2)};
`;

    fs.writeFileSync(outputPath, outputContent);
    console.log(`Successfully processed ${openings.length} openings.`);

} catch (err) {
    console.error('Error processing openings:', err);
}
