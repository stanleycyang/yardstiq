import { describe, expect, it, vi } from 'vitest';
import type { ComparisonResult, JudgeVerdict, ModelConfig } from '../../src/core/types.js';

// Mock modules before importing the runner
vi.mock('../../src/core/runner.js', () => ({
	runComparison: vi.fn(),
}));

vi.mock('../../src/core/judge.js', () => ({
	judgeComparison: vi.fn(),
}));

vi.mock('../../src/providers/registry.js', () => ({
	resolveProvider: vi.fn(() => ({ provider: vi.fn(), modelId: 'mock' })),
}));

function makeModelConfig(alias: string): ModelConfig {
	return {
		name: alias,
		modelId: alias,
		provider: 'test',
		alias,
		pricing: { input: 0, output: 0 },
	};
}

function makeResult(prompt: string, aliases: string[], judge?: JudgeVerdict): ComparisonResult {
	return {
		id: 'test-id',
		prompt,
		responses: aliases.map((alias) => ({
			model: makeModelConfig(alias),
			output: `Response from ${alias}`,
			timing: { startedAt: 0, completedAt: 100, totalMs: 100 },
			usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
			cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
			status: 'success' as const,
		})),
		judge,
		createdAt: new Date().toISOString(),
		totalCost: 0.006,
		totalTimeMs: 100,
	};
}

describe('runBenchmarkSuite', () => {
	it('runs prompts sequentially and returns report', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);

		mockedRun
			.mockResolvedValueOnce(makeResult('Say hello', ['claude-sonnet', 'gpt-4o']))
			.mockResolvedValueOnce(makeResult('Count to five', ['claude-sonnet', 'gpt-4o']));

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		const report = await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml');

		expect(report.suite).toBe('Test Benchmark');
		expect(report.results).toHaveLength(2);
		expect(report.summary).toHaveLength(2);
		expect(mockedRun).toHaveBeenCalledTimes(2);

		// Verify non-streaming, temp 0, timeout 120
		const firstCall = mockedRun.mock.calls[0][0];
		expect(firstCall.options.stream).toBe(false);
		expect(firstCall.options.temperature).toBe(0);
		expect(firstCall.options.timeout).toBe(120);
	});

	it('calls callbacks in order', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);
		mockedRun.mockReset();

		mockedRun.mockResolvedValue(makeResult('test', ['claude-sonnet', 'gpt-4o']));

		const order: string[] = [];
		const callbacks = {
			onSuiteStart: vi.fn(() => order.push('suiteStart')),
			onPromptStart: vi.fn(() => order.push('promptStart')),
			onPromptComplete: vi.fn(() => order.push('promptComplete')),
		};

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', callbacks);

		expect(callbacks.onSuiteStart).toHaveBeenCalledOnce();
		expect(callbacks.onPromptStart).toHaveBeenCalledTimes(2);
		expect(callbacks.onPromptComplete).toHaveBeenCalledTimes(2);

		// suiteStart should come first
		expect(order[0]).toBe('suiteStart');
		// Each prompt: start then complete
		expect(order[1]).toBe('promptStart');
		expect(order[2]).toBe('promptComplete');
	});

	it('aggregates summary stats correctly', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const { judgeComparison } = await import('../../src/core/judge.js');
		const mockedRun = vi.mocked(runComparison);
		const mockedJudge = vi.mocked(judgeComparison);
		mockedRun.mockReset();
		mockedJudge.mockReset();

		const judge1: JudgeVerdict = {
			winner: 'claude-sonnet',
			reasoning: 'Better',
			scores: [
				{ model: 'claude-sonnet', score: 9, strengths: ['good'], weaknesses: [] },
				{ model: 'gpt-4o', score: 7, strengths: ['ok'], weaknesses: ['verbose'] },
			],
			judgeModel: 'claude-sonnet',
			judgeCost: 0.01,
		};

		const judge2: JudgeVerdict = {
			winner: 'gpt-4o',
			reasoning: 'More concise',
			scores: [
				{ model: 'claude-sonnet', score: 7, strengths: ['good'], weaknesses: ['long'] },
				{ model: 'gpt-4o', score: 8, strengths: ['concise'], weaknesses: [] },
			],
			judgeModel: 'claude-sonnet',
			judgeCost: 0.01,
		};

		mockedRun
			.mockResolvedValueOnce(makeResult('prompt1', ['claude-sonnet', 'gpt-4o']))
			.mockResolvedValueOnce(makeResult('prompt2', ['claude-sonnet', 'gpt-4o']));

		mockedJudge.mockResolvedValueOnce(judge1).mockResolvedValueOnce(judge2);

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		const report = await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml');

		// Each model should have 1 win
		const claude = report.summary.find((s) => s.model === 'claude-sonnet');
		const gpt = report.summary.find((s) => s.model === 'gpt-4o');
		expect(claude).toBeDefined();
		expect(gpt).toBeDefined();
		expect(claude?.wins).toBe(1);
		expect(gpt?.wins).toBe(1);

		// Average scores
		expect(claude?.avgScore).toBe(8); // (9 + 7) / 2
		expect(gpt?.avgScore).toBe(7.5); // (7 + 8) / 2

		// Summary sorted by wins desc, tiebreak by avgScore desc
		expect(report.summary[0].model).toBe('claude-sonnet'); // same wins, higher avgScore
	});

	it('calls onJudgeError when judge throws', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const { judgeComparison } = await import('../../src/core/judge.js');
		const mockedRun = vi.mocked(runComparison);
		const mockedJudge = vi.mocked(judgeComparison);
		mockedRun.mockReset();
		mockedJudge.mockReset();

		mockedRun.mockResolvedValue(makeResult('test', ['claude-sonnet', 'gpt-4o']));
		mockedJudge.mockRejectedValue(new Error('Judge API failed'));

		const onJudgeError = vi.fn();
		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', { onJudgeError });

		expect(onJudgeError).toHaveBeenCalledTimes(2); // once per prompt
		expect(onJudgeError.mock.calls[0][1].message).toBe('Judge API failed');
	});

	it('calls onJudgeResult when judge succeeds', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const { judgeComparison } = await import('../../src/core/judge.js');
		const mockedRun = vi.mocked(runComparison);
		const mockedJudge = vi.mocked(judgeComparison);
		mockedRun.mockReset();
		mockedJudge.mockReset();

		mockedRun.mockResolvedValue(makeResult('test', ['claude-sonnet', 'gpt-4o']));
		mockedJudge.mockResolvedValue({
			winner: 'claude-sonnet',
			reasoning: 'Better',
			scores: [
				{ model: 'claude-sonnet', score: 9, strengths: ['good'], weaknesses: [] },
				{ model: 'gpt-4o', score: 7, strengths: ['ok'], weaknesses: ['verbose'] },
			],
			judgeModel: 'claude-sonnet',
			judgeCost: 0.01,
		});

		const onJudgeResult = vi.fn();
		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', { onJudgeResult });

		expect(onJudgeResult).toHaveBeenCalledTimes(2);
		expect(onJudgeResult).toHaveBeenCalledWith(0, 'claude-sonnet');
	});

	it('runs without judge and returns summary with zero scores', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);
		mockedRun.mockReset();

		mockedRun.mockResolvedValue(makeResult('test', ['claude-sonnet', 'gpt-4o']));

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		const report = await runBenchmarkSuite('tests/fixtures/test-benchmark-nojudge.yaml');

		expect(report.suite).toBe('No Judge Benchmark');
		expect(report.results).toHaveLength(1);
		for (const s of report.summary) {
			expect(s.wins).toBe(0);
			expect(s.avgScore).toBe(0);
		}
	});

	it('calls onExpectedMissing for missing expected strings', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);
		mockedRun.mockReset();

		// Response that doesn't contain "hello"
		const result = makeResult('Say hello', ['claude-sonnet', 'gpt-4o']);
		result.responses[0].output = 'Greetings!'; // no "hello"
		mockedRun.mockResolvedValueOnce(result);
		mockedRun.mockResolvedValueOnce(makeResult('Count', ['claude-sonnet', 'gpt-4o']));

		const onExpectedMissing = vi.fn();
		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', { onExpectedMissing });

		expect(onExpectedMissing).toHaveBeenCalledWith('Hello world', 'claude-sonnet', ['hello']);
	});

	it('handles judge scores missing for a model', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const { judgeComparison } = await import('../../src/core/judge.js');
		const mockedRun = vi.mocked(runComparison);
		const mockedJudge = vi.mocked(judgeComparison);
		mockedRun.mockReset();
		mockedJudge.mockReset();

		mockedRun.mockResolvedValue(makeResult('test', ['claude-sonnet', 'gpt-4o']));

		// Judge scores only include claude-sonnet, not gpt-4o
		mockedJudge.mockResolvedValue({
			winner: 'claude-sonnet',
			reasoning: 'Better',
			scores: [{ model: 'claude-sonnet', score: 9, strengths: ['good'], weaknesses: [] }],
			judgeModel: 'claude-sonnet',
			judgeCost: 0.01,
		});

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		const report = await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml');

		const gpt = report.summary.find((s) => s.model === 'gpt-4o');
		// gpt-4o should have 0 avg score since judge scores didn't include it
		expect(gpt?.avgScore).toBe(0);
	});

	it('handles expectedContains when all strings are found', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);
		mockedRun.mockReset();

		const result = makeResult('Say hello', ['claude-sonnet', 'gpt-4o']);
		// Both responses contain "hello" — no onExpectedMissing call
		result.responses[0].output = 'hello world';
		result.responses[1].output = 'hello there';
		mockedRun.mockResolvedValueOnce(result);
		mockedRun.mockResolvedValueOnce(makeResult('Count', ['claude-sonnet', 'gpt-4o']));

		const onExpectedMissing = vi.fn();
		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', { onExpectedMissing });

		expect(onExpectedMissing).not.toHaveBeenCalled();
	});

	it('handles mismatched model aliases in stats (edge case)', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const { judgeComparison } = await import('../../src/core/judge.js');
		const mockedRun = vi.mocked(runComparison);
		const mockedJudge = vi.mocked(judgeComparison);
		mockedRun.mockReset();
		mockedJudge.mockReset();

		// Result where response aliases don't match suite models
		const oddResult: ComparisonResult = {
			id: 'test-id',
			prompt: 'test',
			responses: [
				{
					model: makeModelConfig('unknown-model'),
					output: 'Response',
					timing: { startedAt: 0, completedAt: 100, totalMs: 100 },
					usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
					cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
					status: 'success' as const,
				},
			],
			judge: {
				winner: 'unknown-winner',
				reasoning: 'Better',
				scores: [{ model: 'unknown-model', score: 9, strengths: ['good'], weaknesses: [] }],
				judgeModel: 'claude-sonnet',
				judgeCost: 0.01,
			},
			createdAt: new Date().toISOString(),
			totalCost: 0.003,
			totalTimeMs: 100,
		};
		mockedRun.mockResolvedValueOnce(oddResult);

		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		const report = await runBenchmarkSuite('tests/fixtures/test-benchmark-nojudge.yaml');

		// Suite models are claude-sonnet and gpt-4o, but responses are from unknown-model
		// So stats for suite models should have empty arrays
		for (const s of report.summary) {
			expect(s.wins).toBe(0);
			expect(s.avgScore).toBe(0);
			expect(s.avgTimeMs).toBe(0);
			expect(s.avgCost).toBe(0);
		}
	});

	it('skips expectedContains check for failed responses', async () => {
		const { runComparison } = await import('../../src/core/runner.js');
		const mockedRun = vi.mocked(runComparison);
		mockedRun.mockReset();

		const result = makeResult('Say hello', ['claude-sonnet', 'gpt-4o']);
		result.responses[0].status = 'error';
		result.responses[0].output = '';
		mockedRun.mockResolvedValueOnce(result);
		mockedRun.mockResolvedValueOnce(makeResult('Count', ['claude-sonnet', 'gpt-4o']));

		const onExpectedMissing = vi.fn();
		const { runBenchmarkSuite } = await import('../../src/bench/runner.js');
		await runBenchmarkSuite('tests/fixtures/test-benchmark.yaml', { onExpectedMissing });

		// Only gpt-4o should trigger (not the errored claude-sonnet)
		const claudeCalls = onExpectedMissing.mock.calls.filter(
			(c: [string, string, string[]]) => c[1] === 'claude-sonnet',
		);
		expect(claudeCalls).toHaveLength(0);
	});
});
