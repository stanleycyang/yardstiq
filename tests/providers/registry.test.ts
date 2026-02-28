import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all provider packages before imports
vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(() => vi.fn((id: string) => ({ modelId: id, provider: 'anthropic' }))),
}));

vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => vi.fn((id: string) => ({ modelId: id, provider: 'openai' }))),
}));

vi.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: vi.fn(() =>
		vi.fn((id: string) => ({ modelId: id, provider: 'google' })),
	),
}));

vi.mock('@ai-sdk/gateway', () => ({
	createGateway: vi.fn(() => vi.fn((id: string) => ({ modelId: id, provider: 'gateway' }))),
}));

vi.mock('ollama-ai-provider', () => ({
	createOllama: vi.fn(() => vi.fn((id: string) => ({ modelId: id, provider: 'ollama' }))),
}));

describe('providers/registry', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		// Clear all relevant env vars
		delete process.env.AI_GATEWAY_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
		delete process.env.OPENAI_API_KEY;
		delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
		delete process.env.OLLAMA_BASE_URL;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe('isGatewayAvailable', () => {
		it('returns true when AI_GATEWAY_API_KEY is set', async () => {
			process.env.AI_GATEWAY_API_KEY = 'test-key';
			const { isGatewayAvailable } = await import('../../src/providers/registry.js');
			expect(isGatewayAvailable()).toBe(true);
		});

		it('returns false when AI_GATEWAY_API_KEY is not set', async () => {
			const { isGatewayAvailable } = await import('../../src/providers/registry.js');
			expect(isGatewayAvailable()).toBe(false);
		});
	});

	describe('getAvailableProviders', () => {
		it('returns correct status for each provider', async () => {
			process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
			process.env.OPENAI_API_KEY = 'sk-test';
			const { getAvailableProviders } = await import('../../src/providers/registry.js');
			const providers = getAvailableProviders();
			expect(providers.anthropic).toBe(true);
			expect(providers.openai).toBe(true);
			expect(providers.google).toBe(false);
		});

		it('returns all false when no keys set', async () => {
			const { getAvailableProviders } = await import('../../src/providers/registry.js');
			const providers = getAvailableProviders();
			expect(providers.anthropic).toBe(false);
			expect(providers.openai).toBe(false);
			expect(providers.google).toBe(false);
		});
	});

	describe('resolveProvider', () => {
		it('returns Ollama provider for local models', async () => {
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'Local',
				modelId: 'llama3.2',
				provider: 'ollama',
				alias: 'local:llama3.2',
				pricing: { input: 0, output: 0 },
			});
			expect(result.modelId).toBe('llama3.2');
			expect(result.provider).toBeDefined();
		});

		it('uses custom OLLAMA_BASE_URL', async () => {
			process.env.OLLAMA_BASE_URL = 'http://custom:11434';
			const { createOllama } = await import('ollama-ai-provider');
			const { resolveProvider } = await import('../../src/providers/registry.js');
			resolveProvider({
				name: 'Local',
				modelId: 'llama3.2',
				provider: 'ollama',
				alias: 'local:llama3.2',
				pricing: { input: 0, output: 0 },
			});
			expect(createOllama).toHaveBeenCalledWith({ baseURL: 'http://custom:11434' });
		});

		it('uses direct Anthropic key when available', async () => {
			process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'Claude Sonnet',
				modelId: 'anthropic/claude-sonnet-4.6',
				provider: 'gateway',
				alias: 'claude-sonnet',
				pricing: { input: 3.0, output: 15.0 },
			});
			// Direct provider strips prefix
			expect(result.modelId).toBe('claude-sonnet-4.6');
		});

		it('uses direct OpenAI key when available', async () => {
			process.env.OPENAI_API_KEY = 'sk-test';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'GPT-4o',
				modelId: 'openai/gpt-4o',
				provider: 'gateway',
				alias: 'gpt-4o',
				pricing: { input: 2.5, output: 10.0 },
			});
			expect(result.modelId).toBe('gpt-4o');
		});

		it('uses direct Google key when available', async () => {
			process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'google-test';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'Gemini Pro',
				modelId: 'google/gemini-2.5-pro',
				provider: 'gateway',
				alias: 'gemini-pro',
				pricing: { input: 1.25, output: 10.0 },
			});
			expect(result.modelId).toBe('gemini-2.5-pro');
		});

		it('falls back to gateway when no direct key', async () => {
			process.env.AI_GATEWAY_API_KEY = 'gw-key';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'Claude Sonnet',
				modelId: 'anthropic/claude-sonnet-4.6',
				provider: 'gateway',
				alias: 'claude-sonnet',
				pricing: { input: 3.0, output: 15.0 },
			});
			// Gateway uses full modelId
			expect(result.modelId).toBe('anthropic/claude-sonnet-4.6');
		});

		it('falls back to gateway for providers without direct SDK', async () => {
			process.env.AI_GATEWAY_API_KEY = 'gw-key';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'DeepSeek',
				modelId: 'deepseek/deepseek-v3.2',
				provider: 'gateway',
				alias: 'deepseek',
				pricing: { input: 0.26, output: 0.38 },
			});
			expect(result.modelId).toBe('deepseek/deepseek-v3.2');
		});

		it('throws when no key available (with known provider hint)', async () => {
			const { resolveProvider } = await import('../../src/providers/registry.js');
			expect(() =>
				resolveProvider({
					name: 'Claude Sonnet',
					modelId: 'anthropic/claude-sonnet-4.6',
					provider: 'gateway',
					alias: 'claude-sonnet',
					pricing: { input: 3.0, output: 15.0 },
				}),
			).toThrow('ANTHROPIC_API_KEY');
		});

		it('throws when no key available (unknown provider, no hint)', async () => {
			const { resolveProvider } = await import('../../src/providers/registry.js');
			expect(() =>
				resolveProvider({
					name: 'DeepSeek',
					modelId: 'deepseek/deepseek-v3.2',
					provider: 'gateway',
					alias: 'deepseek',
					pricing: { input: 0.26, output: 0.38 },
				}),
			).toThrow('AI_GATEWAY_API_KEY');
		});

		it('caches gateway provider on second call', async () => {
			process.env.AI_GATEWAY_API_KEY = 'gw-key';
			const { createGateway } = await import('@ai-sdk/gateway');
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const model = {
				name: 'Test',
				modelId: 'deepseek/test',
				provider: 'gateway',
				alias: 'test',
				pricing: { input: 0, output: 0 },
			};
			resolveProvider(model);
			resolveProvider(model);
			// createGateway should only be called once due to caching
			expect(createGateway).toHaveBeenCalledTimes(1);
		});

		it('caches Ollama provider on second call', async () => {
			const { createOllama } = await import('ollama-ai-provider');
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const model = {
				name: 'Local',
				modelId: 'llama3.2',
				provider: 'ollama',
				alias: 'local:llama3.2',
				pricing: { input: 0, output: 0 },
			};
			resolveProvider(model);
			resolveProvider(model);
			expect(createOllama).toHaveBeenCalledTimes(1);
		});

		it('caches direct provider on second call', async () => {
			process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
			const { createAnthropic } = await import('@ai-sdk/anthropic');
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const model = {
				name: 'Claude',
				modelId: 'anthropic/claude-sonnet-4.6',
				provider: 'gateway',
				alias: 'claude-sonnet',
				pricing: { input: 3.0, output: 15.0 },
			};
			resolveProvider(model);
			resolveProvider(model);
			expect(createAnthropic).toHaveBeenCalledTimes(1);
		});

		it('handles modelId without slash by falling back to gateway', async () => {
			process.env.AI_GATEWAY_API_KEY = 'gw-key';
			const { resolveProvider } = await import('../../src/providers/registry.js');
			const result = resolveProvider({
				name: 'Test',
				modelId: 'no-slash-model',
				provider: 'gateway',
				alias: 'test',
				pricing: { input: 0, output: 0 },
			});
			expect(result.modelId).toBe('no-slash-model');
		});

		it('throws for modelId without slash when gateway unavailable', async () => {
			const { resolveProvider } = await import('../../src/providers/registry.js');
			expect(() =>
				resolveProvider({
					name: 'Test',
					modelId: 'no-slash-model',
					provider: 'gateway',
					alias: 'test',
					pricing: { input: 0, output: 0 },
				}),
			).toThrow('AI_GATEWAY_API_KEY');
		});
	});

	describe('resetProviderCache', () => {
		it('clears cached providers', async () => {
			process.env.AI_GATEWAY_API_KEY = 'gw-key';
			const { createGateway } = await import('@ai-sdk/gateway');
			const { resolveProvider, resetProviderCache } = await import(
				'../../src/providers/registry.js'
			);
			const model = {
				name: 'Test',
				modelId: 'deepseek/test',
				provider: 'gateway',
				alias: 'test',
				pricing: { input: 0, output: 0 },
			};
			resolveProvider(model);
			resetProviderCache();
			resolveProvider(model);
			expect(createGateway).toHaveBeenCalledTimes(2);
		});
	});
});
