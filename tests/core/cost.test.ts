import { describe, expect, it } from 'vitest';
import { calculateCost, formatCost } from '../../src/core/cost.js';
import type { ModelConfig } from '../../src/core/types.js';

const mockModel: ModelConfig = {
	name: 'Test Model',
	modelId: 'test-model',
	provider: 'test',
	alias: 'test',
	pricing: { input: 3.0, output: 15.0 }, // per 1M tokens
};

describe('calculateCost', () => {
	it('calculates cost correctly', () => {
		const cost = calculateCost(mockModel, 1000, 500);
		// input: 1000/1M * $3 = $0.003
		// output: 500/1M * $15 = $0.0075
		expect(cost.inputCost).toBeCloseTo(0.003);
		expect(cost.outputCost).toBeCloseTo(0.0075);
		expect(cost.totalCost).toBeCloseTo(0.0105);
	});

	it('returns zero for zero tokens', () => {
		const cost = calculateCost(mockModel, 0, 0);
		expect(cost.totalCost).toBe(0);
	});

	it('handles free models (Ollama)', () => {
		const freeModel: ModelConfig = {
			name: 'Local',
			modelId: 'llama3.2',
			provider: 'ollama',
			alias: 'local:llama3.2',
			pricing: { input: 0, output: 0 },
		};
		const cost = calculateCost(freeModel, 5000, 2000);
		expect(cost.totalCost).toBe(0);
	});
});

describe('formatCost', () => {
	it('formats zero', () => {
		expect(formatCost(0)).toBe('$0.00');
	});

	it('formats small amounts with more decimals', () => {
		expect(formatCost(0.001234)).toBe('$0.001234');
	});

	it('formats medium amounts', () => {
		expect(formatCost(0.0534)).toBe('$0.0534');
	});

	it('formats dollar amounts', () => {
		expect(formatCost(1.5)).toBe('$1.50');
	});
});
