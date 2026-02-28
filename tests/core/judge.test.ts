import { describe, expect, it, vi } from 'vitest';
import type { ComparisonResult, ModelConfig, ModelResponse } from '../../src/core/types.js';

vi.mock('../../src/providers/registry.js', () => ({
	resolveProvider: vi.fn(() => ({
		provider: vi.fn(),
		modelId: 'test-judge-model',
	})),
}));

vi.mock('ai', () => ({
	generateText: vi.fn(),
}));

function makeModel(alias: string): ModelConfig {
	return {
		name: alias,
		modelId: `test/${alias}`,
		provider: 'gateway',
		alias,
		pricing: { input: 3.0, output: 15.0 },
	};
}

function makeResponse(alias: string, output: string): ModelResponse {
	return {
		model: makeModel(alias),
		output,
		timing: { startedAt: 0, completedAt: 100, totalMs: 100 },
		usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
		cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
		status: 'success',
	};
}

function makeComparisonResult(responses: ModelResponse[]): ComparisonResult {
	return {
		id: 'test-id',
		prompt: 'Explain quicksort',
		responses,
		createdAt: '2025-01-01T00:00:00.000Z',
		totalCost: 0.006,
		totalTimeMs: 100,
	};
}

describe('judgeComparison', () => {
	it('returns parsed verdict from judge response', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: JSON.stringify({
				winner: 'model-a',
				reasoning: 'Model A was more concise and accurate.',
				scores: [
					{ model: 'model-a', score: 9, strengths: ['concise'], weaknesses: [] },
					{ model: 'model-b', score: 7, strengths: ['detailed'], weaknesses: ['verbose'] },
				],
			}),
			usage: { inputTokens: 500, outputTokens: 200 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([
			makeResponse('model-a', 'Short answer'),
			makeResponse('model-b', 'Long detailed answer'),
		]);

		const verdict = await judgeComparison(result);

		expect(verdict.winner).toBe('model-a');
		expect(verdict.reasoning).toBe('Model A was more concise and accurate.');
		expect(verdict.scores).toHaveLength(2);
		expect(verdict.scores[0].score).toBe(9);
		expect(verdict.scores[1].score).toBe(7);
		expect(verdict.judgeModel).toBe('claude-sonnet');
		expect(verdict.judgeCost).toBeGreaterThan(0);
	});

	it('uses custom judge model', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: '{"winner":"a","reasoning":"better","scores":[{"model":"a","score":8,"strengths":["good"],"weaknesses":[]}]}',
			usage: { inputTokens: 100, outputTokens: 50 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		const verdict = await judgeComparison(result, { judgeModel: 'gpt-4o' });

		expect(verdict.judgeModel).toBe('gpt-4o');
	});

	it('includes custom criteria in prompt', async () => {
		const { generateText } = await import('ai');
		const mockedGenerate = vi.mocked(generateText);
		mockedGenerate.mockResolvedValue({
			text: '{"winner":"a","reasoning":"better","scores":[{"model":"a","score":8,"strengths":["good"],"weaknesses":[]}]}',
			usage: { inputTokens: 100, outputTokens: 50 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		await judgeComparison(result, { criteria: 'Focus on code quality' });

		const callArgs = mockedGenerate.mock.calls[mockedGenerate.mock.calls.length - 1][0];
		expect(callArgs.prompt).toContain('Focus on code quality');
	});

	it('throws on invalid JSON response', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: 'This is not JSON at all, just plain text with no braces',
			usage: { inputTokens: 100, outputTokens: 50 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		await expect(judgeComparison(result)).rejects.toThrow('Judge did not return valid JSON');
	});

	it('extracts JSON from text with surrounding content', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: 'Here is my analysis:\n\n{"winner":"a","reasoning":"better","scores":[{"model":"a","score":9,"strengths":["great"],"weaknesses":[]}]}\n\nHope this helps!',
			usage: { inputTokens: 100, outputTokens: 50 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		const verdict = await judgeComparison(result);

		expect(verdict.winner).toBe('a');
		expect(verdict.scores[0].score).toBe(9);
	});

	it('filters out non-success responses', async () => {
		const { generateText } = await import('ai');
		const mockedGenerate = vi.mocked(generateText);
		mockedGenerate.mockResolvedValue({
			text: '{"winner":"a","reasoning":"only one","scores":[{"model":"a","score":8,"strengths":["ok"],"weaknesses":[]}]}',
			usage: { inputTokens: 100, outputTokens: 50 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const errorResponse: ModelResponse = {
			model: makeModel('b'),
			output: '',
			timing: { startedAt: 0, completedAt: 100, totalMs: 100 },
			usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
			cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
			status: 'error',
			error: 'API failed',
		};

		const result = makeComparisonResult([makeResponse('a', 'answer'), errorResponse]);
		await judgeComparison(result);

		const callArgs = mockedGenerate.mock.calls[mockedGenerate.mock.calls.length - 1][0];
		// Only the success model should appear in the prompt
		expect(callArgs.prompt).toContain('Model: a');
		expect(callArgs.prompt).not.toContain('Model: b');
	});

	it('handles undefined token counts in usage', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: '{"winner":"a","reasoning":"good","scores":[{"model":"a","score":8,"strengths":["ok"],"weaknesses":[]}]}',
			usage: { inputTokens: undefined, outputTokens: undefined },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		const verdict = await judgeComparison(result);

		expect(verdict.judgeCost).toBe(0);
	});

	it('calculates judge cost from usage', async () => {
		const { generateText } = await import('ai');
		vi.mocked(generateText).mockResolvedValue({
			text: '{"winner":"a","reasoning":"good","scores":[{"model":"a","score":8,"strengths":["ok"],"weaknesses":[]}]}',
			usage: { inputTokens: 1000, outputTokens: 500 },
		} as any);

		const { judgeComparison } = await import('../../src/core/judge.js');

		const result = makeComparisonResult([makeResponse('a', 'answer')]);
		const verdict = await judgeComparison(result);

		// Judge model uses claude-sonnet pricing: $3/1M in, $15/1M out
		// 1000/1M * 3 = 0.003, 500/1M * 15 = 0.0075, total = 0.0105
		expect(verdict.judgeCost).toBeCloseTo(0.0105);
	});
});
