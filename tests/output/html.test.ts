import { describe, expect, it } from 'vitest';
import type { ComparisonResult, ModelResponse } from '../../src/core/types.js';
import { formatHTML } from '../../src/output/html.js';

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
		error: status !== 'success' ? 'API error occurred' : undefined,
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

describe('formatHTML', () => {
	it('returns valid HTML structure', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('<!DOCTYPE html>');
		expect(html).toContain('<html lang="en">');
		expect(html).toContain('</html>');
		expect(html).toContain('<head>');
		expect(html).toContain('</head>');
		expect(html).toContain('<body>');
		expect(html).toContain('</body>');
	});

	it('escapes HTML entities for XSS prevention', () => {
		const xssResult = makeResult({
			prompt: '<script>alert("xss")</script>',
			responses: [
				{
					...makeResponse('model-a'),
					output: '<img onerror="alert(1)" src="x">',
				},
			],
		});
		const html = formatHTML(xssResult);
		expect(html).not.toContain('<script>alert("xss")</script>');
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<img onerror');
		expect(html).toContain('&lt;img onerror=');
	});

	it('contains model cards', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('class="model-card"');
		expect(html).toContain('Model model-a');
		expect(html).toContain('Model model-b');
		expect(html).toContain('Response from model-a');
		expect(html).toContain('Response from model-b');
	});

	it('shows error message for failed models', () => {
		const html = formatHTML(makeResult({ responses: [makeResponse('model-a', 'error')] }));
		expect(html).toContain('API error occurred');
		expect(html).toContain('class="status error"');
	});

	it('shows status text for error without error message', () => {
		const errorResp = makeResponse('model-a', 'error');
		errorResp.error = undefined;
		const html = formatHTML(makeResult({ responses: [errorResp] }));
		// Should fall back to showing the status text
		expect(html).toContain('>error</pre>');
	});

	it('shows status for timeout models', () => {
		const html = formatHTML(makeResult({ responses: [makeResponse('model-a', 'timeout')] }));
		expect(html).toContain('class="status timeout"');
	});

	it('contains judge section when present', () => {
		const html = formatHTML(
			makeResult({
				judge: {
					winner: 'model-a',
					reasoning: 'Model A was better.',
					scores: [
						{ model: 'model-a', score: 9, strengths: ['good'], weaknesses: [] },
						{ model: 'model-b', score: 7, strengths: ['ok'], weaknesses: ['verbose'] },
					],
					judgeModel: 'claude-sonnet',
					judgeCost: 0.01,
				},
			}),
		);
		expect(html).toContain('class="judge"');
		expect(html).toContain('Judge Verdict');
		expect(html).toContain('model-a');
		expect(html).toContain('Model A was better.');
		expect(html).toContain('9/10');
		expect(html).toContain('7/10');
	});

	it('does not contain judge section when absent', () => {
		const html = formatHTML(makeResult());
		expect(html).not.toContain('class="judge"');
	});

	it('contains summary stats', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('class="summary"');
		expect(html).toContain('Total cost:');
		expect(html).toContain('1.00s');
	});

	it('contains title', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('<title>yardstiq');
	});

	it('contains prompt', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('Explain quicksort');
	});

	it('contains performance stats per model', () => {
		const html = formatHTML(makeResult());
		expect(html).toContain('Time:');
		expect(html).toContain('Tokens:');
		expect(html).toContain('Cost:');
	});
});
