import type { ModelConfig } from './types.js';

/**
 * Calculate the cost of a model call from token usage and pricing.
 * Pricing is per 1M tokens.
 */
export function calculateCost(
	model: ModelConfig,
	inputTokens: number,
	outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
	const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
	const outputCost = (outputTokens / 1_000_000) * model.pricing.output;
	return {
		inputCost,
		outputCost,
		totalCost: inputCost + outputCost,
	};
}

/**
 * Format a USD cost for display.
 * Shows more decimal places for very small amounts.
 */
export function formatCost(cost: number): string {
	if (cost === 0) return '$0.00';
	if (cost < 0.01) return `$${cost.toFixed(6)}`;
	if (cost < 1) return `$${cost.toFixed(4)}`;
	return `$${cost.toFixed(2)}`;
}
