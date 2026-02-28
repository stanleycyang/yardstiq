import { describe, expect, it, vi } from 'vitest';
import type { ModelConfig, StreamCallbacks } from '../../src/core/types.js';

vi.mock('../../src/providers/registry.js', () => ({
	resolveProvider: vi.fn(),
}));

vi.mock('ai', () => ({
	streamText: vi.fn(),
	generateText: vi.fn(),
}));

vi.mock('ulid', () => ({
	ulid: vi.fn(() => 'TEST-ULID'),
}));

function makeModel(alias: string, provider = 'gateway'): ModelConfig {
	return {
		name: alias,
		modelId: `test/${alias}`,
		provider,
		alias,
		pricing: { input: 3.0, output: 15.0 },
	};
}

describe('runComparison', () => {
	it('runs multiple models in parallel and returns result', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		const mockedResolve = vi.mocked(resolveProvider);
		const mockedGenerate = vi.mocked(generateText);

		const mockProvider = vi.fn();
		mockedResolve.mockReturnValue({ provider: mockProvider, modelId: 'test-model' });

		mockedGenerate.mockResolvedValue({
			text: 'Hello world',
			usage: { inputTokens: 10, outputTokens: 20 },
		} as any);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'Say hello',
			models: [makeModel('model-a'), makeModel('model-b')],
			options: { temperature: 0, maxTokens: 2048, stream: false, timeout: 60 },
		});

		expect(result.id).toBe('TEST-ULID');
		expect(result.prompt).toBe('Say hello');
		expect(result.responses).toHaveLength(2);
		expect(result.responses[0].status).toBe('success');
		expect(result.responses[0].output).toBe('Hello world');
		expect(result.responses[1].status).toBe('success');
		expect(result.totalCost).toBeGreaterThanOrEqual(0);
		expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
	});

	it('includes systemPrompt when provided', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		const mockedResolve = vi.mocked(resolveProvider);
		const mockedGenerate = vi.mocked(generateText);

		mockedResolve.mockReturnValue({ provider: vi.fn(), modelId: 'test' });
		mockedGenerate.mockResolvedValue({
			text: 'response',
			usage: { inputTokens: 5, outputTokens: 10 },
		} as any);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'hello',
			systemPrompt: 'Be brief',
			models: [makeModel('a'), makeModel('b')],
			options: { temperature: 0, maxTokens: 100, stream: false, timeout: 30 },
		});

		expect(result.systemPrompt).toBe('Be brief');
	});
});

describe('runSingleModel (streaming)', () => {
	it('streams tokens and calls callbacks', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { streamText } = await import('ai');
		const mockedResolve = vi.mocked(resolveProvider);
		const mockedStream = vi.mocked(streamText);

		mockedResolve.mockReturnValue({ provider: vi.fn(), modelId: 'test-model' });

		const tokens = ['Hello', ' ', 'world'];
		mockedStream.mockReturnValue({
			textStream: (async function* () {
				for (const t of tokens) yield t;
			})(),
			usage: Promise.resolve({ inputTokens: 10, outputTokens: 30 }),
		} as any);

		const onToken = vi.fn();
		const onComplete = vi.fn();
		const onError = vi.fn();
		const callbacks: StreamCallbacks = { onToken, onComplete, onError };

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison(
			{
				prompt: 'hello',
				models: [makeModel('model-a')],
				options: { temperature: 0, maxTokens: 2048, stream: true, timeout: 60 },
			},
			callbacks,
		);

		expect(result.responses).toHaveLength(1);
		expect(result.responses[0].status).toBe('success');
		expect(result.responses[0].output).toBe('Hello world');
		expect(onToken).toHaveBeenCalledTimes(3);
		expect(onToken).toHaveBeenCalledWith('model-a', 'Hello');
		expect(onToken).toHaveBeenCalledWith('model-a', ' ');
		expect(onToken).toHaveBeenCalledWith('model-a', 'world');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onError).not.toHaveBeenCalled();
	});

	it('handles streaming with undefined usage tokens', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { streamText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });

		vi.mocked(streamText).mockReturnValue({
			textStream: (async function* () {
				yield 'hi';
			})(),
			usage: Promise.resolve({ inputTokens: undefined, outputTokens: undefined }),
		} as any);

		const callbacks: StreamCallbacks = {
			onToken: vi.fn(),
			onComplete: vi.fn(),
			onError: vi.fn(),
		};

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison(
			{
				prompt: 'hello',
				models: [makeModel('a')],
				options: { temperature: 0, maxTokens: 100, stream: true, timeout: 60 },
			},
			callbacks,
		);

		expect(result.responses[0].usage.inputTokens).toBe(0);
		expect(result.responses[0].usage.outputTokens).toBe(0);
	});

	it('handles streaming with empty stream (no tokens)', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { streamText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });

		vi.mocked(streamText).mockReturnValue({
			textStream: (async function* () {
				// empty stream — no tokens yielded
			})(),
			usage: Promise.resolve({ inputTokens: 5, outputTokens: 0 }),
		} as any);

		const callbacks: StreamCallbacks = {
			onToken: vi.fn(),
			onComplete: vi.fn(),
			onError: vi.fn(),
		};

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison(
			{
				prompt: 'hello',
				models: [makeModel('a')],
				options: { temperature: 0, maxTokens: 100, stream: true, timeout: 60 },
			},
			callbacks,
		);

		// No first token since nothing was streamed
		expect(result.responses[0].timing.firstTokenAt).toBeUndefined();
		expect(result.responses[0].timing.timeToFirstToken).toBeUndefined();
		expect(result.responses[0].output).toBe('');
	});

	it('records firstTokenAt and timeToFirstToken in streaming', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { streamText } = await import('ai');
		const mockedResolve = vi.mocked(resolveProvider);
		const mockedStream = vi.mocked(streamText);

		mockedResolve.mockReturnValue({ provider: vi.fn(), modelId: 'test' });

		mockedStream.mockReturnValue({
			textStream: (async function* () {
				yield 'token';
			})(),
			usage: Promise.resolve({ inputTokens: 5, outputTokens: 10 }),
		} as any);

		const callbacks: StreamCallbacks = {
			onToken: vi.fn(),
			onComplete: vi.fn(),
			onError: vi.fn(),
		};

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison(
			{
				prompt: 'hello',
				models: [makeModel('a')],
				options: { temperature: 0, maxTokens: 100, stream: true, timeout: 60 },
			},
			callbacks,
		);

		expect(result.responses[0].timing.firstTokenAt).toBeDefined();
		expect(result.responses[0].timing.timeToFirstToken).toBeDefined();
	});
});

describe('runSingleModel (non-streaming)', () => {
	it('returns full response without callbacks', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		const mockedResolve = vi.mocked(resolveProvider);
		const mockedGenerate = vi.mocked(generateText);

		mockedResolve.mockReturnValue({ provider: vi.fn(), modelId: 'test' });
		mockedGenerate.mockResolvedValue({
			text: 'Full response',
			usage: { inputTokens: 15, outputTokens: 25 },
		} as any);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'hello',
			models: [makeModel('test-model')],
			options: { temperature: 0.5, maxTokens: 1024, stream: false, timeout: 30 },
		});

		expect(result.responses[0].output).toBe('Full response');
		expect(result.responses[0].status).toBe('success');
		expect(result.responses[0].usage.inputTokens).toBe(15);
		expect(result.responses[0].usage.outputTokens).toBe(25);
		expect(result.responses[0].usage.totalTokens).toBe(40);
		expect(result.responses[0].timing.firstTokenAt).toBeUndefined();
	});

	it('calculates cost correctly', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });
		vi.mocked(generateText).mockResolvedValue({
			text: 'result',
			usage: { inputTokens: 1000, outputTokens: 500 },
		} as any);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'hello',
			models: [makeModel('model-a')],
			options: { temperature: 0, maxTokens: 2048, stream: false, timeout: 60 },
		});

		// $3/1M input * 1000 = $0.003, $15/1M output * 500 = $0.0075
		expect(result.responses[0].cost.inputCost).toBeCloseTo(0.003);
		expect(result.responses[0].cost.outputCost).toBeCloseTo(0.0075);
		expect(result.responses[0].cost.totalCost).toBeCloseTo(0.0105);
	});
});

describe('runSingleModel (error handling)', () => {
	it('handles timeout (AbortError) gracefully', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });

		const abortError = new Error('The operation was aborted');
		abortError.name = 'AbortError';
		vi.mocked(generateText).mockRejectedValue(abortError);

		const onError = vi.fn();
		const callbacks: StreamCallbacks = {
			onToken: vi.fn(),
			onComplete: vi.fn(),
			onError,
		};

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison(
			{
				prompt: 'hello',
				models: [makeModel('slow-model')],
				options: { temperature: 0, maxTokens: 2048, stream: false, timeout: 1 },
			},
			callbacks,
		);

		expect(result.responses[0].status).toBe('timeout');
		expect(result.responses[0].error).toBe('The operation was aborted');
		expect(result.responses[0].output).toBe('');
		expect(result.responses[0].usage.totalTokens).toBe(0);
		expect(result.responses[0].cost.totalCost).toBe(0);
		expect(onError).toHaveBeenCalledWith('slow-model', abortError);
	});

	it('handles generic errors gracefully', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });

		const genericError = new Error('API rate limit exceeded');
		vi.mocked(generateText).mockRejectedValue(genericError);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'hello',
			models: [makeModel('failing-model')],
			options: { temperature: 0, maxTokens: 2048, stream: false, timeout: 60 },
		});

		expect(result.responses[0].status).toBe('error');
		expect(result.responses[0].error).toBe('API rate limit exceeded');
	});

	it('handles missing usage fields with defaults', async () => {
		const { resolveProvider } = await import('../../src/providers/registry.js');
		const { generateText } = await import('ai');
		vi.mocked(resolveProvider).mockReturnValue({ provider: vi.fn(), modelId: 'test' });
		vi.mocked(generateText).mockResolvedValue({
			text: 'result',
			usage: { inputTokens: undefined, outputTokens: undefined },
		} as any);

		const { runComparison } = await import('../../src/core/runner.js');

		const result = await runComparison({
			prompt: 'hello',
			models: [makeModel('test')],
			options: { temperature: 0, maxTokens: 2048, stream: false, timeout: 60 },
		});

		expect(result.responses[0].usage.inputTokens).toBe(0);
		expect(result.responses[0].usage.outputTokens).toBe(0);
	});
});
