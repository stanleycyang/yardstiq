import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { BenchmarkSuite } from '../core/types.js';

export function parseBenchmarkFile(filePath: string): BenchmarkSuite {
	const raw = readFileSync(filePath, 'utf-8');
	const data = parse(raw) as Record<string, unknown>;

	if (!data || typeof data !== 'object') {
		throw new Error(`Invalid benchmark file: ${filePath} — expected a YAML object`);
	}

	if (!data.name || typeof data.name !== 'string') {
		throw new Error('Benchmark file missing required field: "name"');
	}

	if (!Array.isArray(data.models) || data.models.length < 2) {
		throw new Error('Benchmark file requires "models" array with at least 2 entries');
	}

	if (!Array.isArray(data.prompts) || data.prompts.length < 1) {
		throw new Error('Benchmark file requires "prompts" array with at least 1 entry');
	}

	for (let i = 0; i < data.prompts.length; i++) {
		const p = data.prompts[i] as Record<string, unknown>;
		if (!p.name || typeof p.name !== 'string') {
			throw new Error(`Prompt at index ${i} missing required field: "name"`);
		}
		if (!p.prompt || typeof p.prompt !== 'string') {
			throw new Error(`Prompt "${p.name || i}" missing required field: "prompt"`);
		}
	}

	return {
		name: data.name,
		description: typeof data.description === 'string' ? data.description : undefined,
		models: data.models as string[],
		judge:
			data.judge && typeof data.judge === 'object'
				? (data.judge as BenchmarkSuite['judge'])
				: undefined,
		prompts: (data.prompts as Record<string, unknown>[]).map((p) => ({
			name: p.name as string,
			prompt: p.prompt as string,
			system: typeof p.system === 'string' ? p.system : undefined,
			criteria: typeof p.criteria === 'string' ? p.criteria : undefined,
			expectedContains: Array.isArray(p.expectedContains)
				? (p.expectedContains as string[])
				: undefined,
			maxTokens: typeof p.maxTokens === 'number' ? p.maxTokens : undefined,
		})),
	};
}
