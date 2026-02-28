import { describe, expect, it } from 'vitest';
import type { ComparisonResult, ModelResponse } from '../../src/core/types.js';
import { formatMarkdown } from '../../src/output/markdown.js';

function makeResponse(
	alias: string,
	status: 'success' | 'error' | 'timeout' = 'success',
): ModelResponse {
	return {
		model: {
			name: `Model ${alias}`,
			modelId: `test/${alias}`,
			provider: 'gateway',
			alias,
			pricing: { input: 3.0, output: 15.0 },
		},
		output: status === 'success' ? `Response from ${alias}` : '',
		timing: { startedAt: 1000, completedAt: 2000, totalMs: 1000 },
		usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
		cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
		status,
		error: status !== 'success' ? 'Something went wrong' : undefined,
	};
}

function makeResult(overrides: Partial<ComparisonResult> = {}): ComparisonResult {
	return {
		id: 'test-id',
		prompt: 'Explain quicksort',
		responses: [makeResponse('model-a'), makeResponse('model-b')],
		createdAt: '2025-01-01T00:00:00.000Z',
		totalCost: 0.006,
		totalTimeMs: 1000,
		...overrides,
	};
}

describe('formatMarkdown', () => {
	it('contains header with prompt', () => {
		const md = formatMarkdown(makeResult());
		expect(md).toContain('# AI Model Comparison');
		expect(md).toContain('**Prompt:** Explain quicksort');
	});

	it('contains system prompt when present', () => {
		const md = formatMarkdown(makeResult({ systemPrompt: 'Be concise' }));
		expect(md).toContain('**System:** Be concise');
	});

	it('does not contain system line when absent', () => {
		const md = formatMarkdown(makeResult());
		expect(md).not.toContain('**System:**');
	});

	it('includes each model response section', () => {
		const md = formatMarkdown(makeResult());
		expect(md).toContain('## Model model-a (model-a)');
		expect(md).toContain('Response from model-a');
		expect(md).toContain('## Model model-b (model-b)');
		expect(md).toContain('Response from model-b');
	});

	it('handles error status', () => {
		const md = formatMarkdown(
			makeResult({
				responses: [makeResponse('model-a', 'error')],
			}),
		);
		expect(md).toContain('*error*: Something went wrong');
	});

	it('handles timeout status', () => {
		const md = formatMarkdown(
			makeResult({
				responses: [makeResponse('model-a', 'timeout')],
			}),
		);
		expect(md).toContain('*timeout*: Something went wrong');
	});

	it('handles error status without error message', () => {
		const errorResp = makeResponse('model-a', 'error');
		errorResp.error = undefined;
		const md = formatMarkdown(makeResult({ responses: [errorResp] }));
		expect(md).toContain('*error*');
		expect(md).not.toContain('*error*:');
	});

	it('includes stats for each model', () => {
		const md = formatMarkdown(makeResult());
		expect(md).toContain('Time:');
		expect(md).toContain('Tokens:');
		expect(md).toContain('Cost:');
	});

	it('includes judge section when present', () => {
		const md = formatMarkdown(
			makeResult({
				judge: {
					winner: 'model-a',
					reasoning: 'Model A was more concise.',
					scores: [
						{ model: 'model-a', score: 9, strengths: ['concise'], weaknesses: [] },
						{ model: 'model-b', score: 7, strengths: ['detailed'], weaknesses: ['verbose'] },
					],
					judgeModel: 'claude-sonnet',
					judgeCost: 0.01,
				},
			}),
		);
		expect(md).toContain('## Judge Verdict');
		expect(md).toContain('**Winner:** model-a');
		expect(md).toContain('Model A was more concise.');
		expect(md).toContain('**model-a** (9/10)');
		expect(md).toContain('**model-b** (7/10)');
	});

	it('includes summary with total cost', () => {
		const md = formatMarkdown(makeResult());
		expect(md).toContain('Total cost:');
		expect(md).toContain('Time:');
	});

	it('contains date', () => {
		const md = formatMarkdown(makeResult());
		expect(md).toContain('**Date:** 2025-01-01T00:00:00.000Z');
	});
});
