import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ComparisonResult } from '../core/types.js';

const HISTORY_DIR = join(homedir(), '.aidiff', 'history');

function ensureHistoryDir(): void {
	if (!existsSync(HISTORY_DIR)) {
		mkdirSync(HISTORY_DIR, { recursive: true });
	}
}

export function saveResult(result: ComparisonResult, name?: string): void {
	ensureHistoryDir();
	const filename = name || result.id;
	const filepath = join(HISTORY_DIR, `${filename}.json`);
	writeFileSync(filepath, JSON.stringify(result, null, 2));
}

export function loadResult(name: string): ComparisonResult | null {
	const filepath = join(HISTORY_DIR, `${name}.json`);
	try {
		const raw = readFileSync(filepath, 'utf-8');
		return JSON.parse(raw) as ComparisonResult;
	} catch {
		return null;
	}
}

export function listHistory(): { name: string; date: string; prompt: string }[] {
	ensureHistoryDir();
	try {
		const files = readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.json'));
		return files.map((f) => {
			const raw = readFileSync(join(HISTORY_DIR, f), 'utf-8');
			const result = JSON.parse(raw) as ComparisonResult;
			return {
				name: f.replace('.json', ''),
				date: result.createdAt,
				prompt: result.prompt.slice(0, 80),
			};
		});
	} catch {
		return [];
	}
}
