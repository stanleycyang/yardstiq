import { describe, expect, it } from 'vitest';
import type { ComparisonResult } from '../../src/core/types.js';
import { formatJSON } from '../../src/output/json.js';

function makeResult(): ComparisonResult {
	return {
		id: 'test-id',
		prompt: 'Hello world',
		responses: [
			{
				model: {
					name: 'Model A',
					modelId: 'test/a',
					provider: 'gateway',
					alias: 'model-a',
					pricing: { input: 3.0, output: 15.0 },
				},
				output: 'Response A',
				timing: { startedAt: 1000, completedAt: 2000, totalMs: 1000 },
				usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
				cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
				status: 'success',
			},
		],
		createdAt: '2025-01-01T00:00:00.000Z',
		totalCost: 0.003,
		totalTimeMs: 1000,
	};
}

describe('formatJSON', () => {
	it('returns valid JSON string', () => {
		const result = makeResult();
		const json = formatJSON(result);
		const parsed = JSON.parse(json);
		expect(parsed).toBeDefined();
	});

	it('includes all ComparisonResult fields', () => {
		const result = makeResult();
		const json = formatJSON(result);
		const parsed = JSON.parse(json);
		expect(parsed.id).toBe('test-id');
		expect(parsed.prompt).toBe('Hello world');
		expect(parsed.responses).toHaveLength(1);
		expect(parsed.createdAt).toBe('2025-01-01T00:00:00.000Z');
		expect(parsed.totalCost).toBe(0.003);
		expect(parsed.totalTimeMs).toBe(1000);
	});

	it('pretty-prints with 2-space indent', () => {
		const result = makeResult();
		const json = formatJSON(result);
		// Check that it has proper indentation (2 spaces)
		expect(json).toContain('  "id"');
		expect(json).toContain('  "prompt"');
	});
});
