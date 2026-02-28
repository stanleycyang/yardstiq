import { describe, expect, it } from 'vitest';
import { getGatewayModelId, MODEL_REGISTRY, resolveModel } from '../../src/core/models.js';

describe('MODEL_REGISTRY', () => {
	it('has all expected models', () => {
		const aliases = Object.keys(MODEL_REGISTRY);
		expect(aliases).toContain('claude-sonnet');
		expect(aliases).toContain('claude-haiku');
		expect(aliases).toContain('claude-opus');
		expect(aliases).toContain('gpt-4o');
		expect(aliases).toContain('gpt-4o-mini');
		expect(aliases).toContain('gemini-pro');
		expect(aliases).toContain('gemini-flash');
		expect(aliases).toContain('llama3');
		expect(aliases).toContain('deepseek');
		expect(aliases).toContain('mistral-large');
	});

	it('maps claude-sonnet to correct model ID', () => {
		expect(MODEL_REGISTRY['claude-sonnet'].modelId).toBe('claude-sonnet-4-20250514');
	});

	it('maps claude-opus to correct model ID', () => {
		expect(MODEL_REGISTRY['claude-opus'].modelId).toBe('claude-opus-4-6');
	});

	it('all entries have required fields', () => {
		for (const [alias, config] of Object.entries(MODEL_REGISTRY)) {
			expect(config.name).toBeTruthy();
			expect(config.modelId).toBeTruthy();
			expect(config.provider).toBeTruthy();
			expect(config.alias).toBe(alias);
			expect(config.pricing.input).toBeGreaterThanOrEqual(0);
			expect(config.pricing.output).toBeGreaterThanOrEqual(0);
		}
	});
});

describe('resolveModel', () => {
	it('resolves aliases', () => {
		const model = resolveModel('claude-sonnet');
		expect(model.name).toBe('Claude Sonnet');
		expect(model.modelId).toBe('claude-sonnet-4-20250514');
		expect(model.provider).toBe('anthropic');
	});

	it('resolves full model IDs', () => {
		const model = resolveModel('claude-sonnet-4-20250514');
		expect(model.alias).toBe('claude-sonnet');
	});

	it('resolves local (Ollama) models', () => {
		const model = resolveModel('local:llama3.2');
		expect(model.provider).toBe('ollama');
		expect(model.modelId).toBe('llama3.2');
		expect(model.alias).toBe('local:llama3.2');
		expect(model.pricing.input).toBe(0);
		expect(model.pricing.output).toBe(0);
	});

	it('throws for unknown models without slash', () => {
		expect(() => resolveModel('nonexistent-model')).toThrow('Unknown model');
	});

	it('resolves gateway format with known model', () => {
		const model = resolveModel('openai/gpt-4o');
		expect(model.provider).toBe('gateway');
		expect(model.alias).toBe('openai/gpt-4o');
		// Should inherit pricing from known registry entry
		expect(model.pricing.input).toBe(2.5);
		expect(model.pricing.output).toBe(10.0);
	});

	it('resolves gateway format with unknown model', () => {
		const model = resolveModel('xai/grok-3');
		expect(model.provider).toBe('gateway');
		expect(model.modelId).toBe('xai/grok-3');
		expect(model.alias).toBe('xai/grok-3');
		expect(model.pricing.input).toBe(0);
		expect(model.pricing.output).toBe(0);
	});

	it('resolves gateway format for anthropic model', () => {
		const model = resolveModel('anthropic/claude-sonnet-4-20250514');
		expect(model.provider).toBe('gateway');
		expect(model.name).toBe('Claude Sonnet');
		expect(model.pricing.input).toBe(3.0);
	});
});

describe('getGatewayModelId', () => {
	it('creates gateway model ID for known providers', () => {
		expect(getGatewayModelId(MODEL_REGISTRY['claude-sonnet'])).toBe(
			'anthropic/claude-sonnet-4-20250514',
		);
		expect(getGatewayModelId(MODEL_REGISTRY['gpt-4o'])).toBe('openai/gpt-4o');
		expect(getGatewayModelId(MODEL_REGISTRY['gemini-pro'])).toBe('google/gemini-2.0-pro');
	});

	it('returns modelId as-is for unknown providers', () => {
		expect(
			getGatewayModelId({
				name: 'Test',
				modelId: 'test-model',
				provider: 'unknown',
				alias: 'test',
				pricing: { input: 0, output: 0 },
			}),
		).toBe('test-model');
	});
});
