import { describe, expect, it } from 'vitest';
import { MODEL_REGISTRY, resolveModel } from '../../src/core/models.js';

describe('MODEL_REGISTRY', () => {
	it('has all expected models', () => {
		const aliases = Object.keys(MODEL_REGISTRY);
		expect(aliases).toContain('claude-sonnet');
		expect(aliases).toContain('claude-haiku');
		expect(aliases).toContain('claude-opus');
		expect(aliases).toContain('gpt-4o');
		expect(aliases).toContain('gpt-4o-mini');
		expect(aliases).toContain('gpt-5');
		expect(aliases).toContain('gemini-pro');
		expect(aliases).toContain('gemini-flash');
		expect(aliases).toContain('deepseek');
		expect(aliases).toContain('mistral-large');
		expect(aliases).toContain('llama-4-maverick');
	});

	it('all models use gateway provider', () => {
		for (const config of Object.values(MODEL_REGISTRY)) {
			expect(config.provider).toBe('gateway');
		}
	});

	it('all model IDs use provider/model format', () => {
		for (const config of Object.values(MODEL_REGISTRY)) {
			expect(config.modelId).toContain('/');
		}
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
		expect(model.name).toBe('Claude Sonnet 4.6');
		expect(model.modelId).toBe('anthropic/claude-sonnet-4.6');
		expect(model.provider).toBe('gateway');
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
		const model = resolveModel('somevendor/new-model');
		expect(model.provider).toBe('gateway');
		expect(model.modelId).toBe('somevendor/new-model');
		expect(model.alias).toBe('somevendor/new-model');
		expect(model.pricing.input).toBe(0);
		expect(model.pricing.output).toBe(0);
	});

	it('resolves grok-3 alias from registry', () => {
		const model = resolveModel('grok-3');
		expect(model.provider).toBe('gateway');
		expect(model.modelId).toBe('xai/grok-3');
		expect(model.pricing.input).toBe(3.0);
	});
});
