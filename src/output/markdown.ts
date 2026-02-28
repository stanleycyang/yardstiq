import { formatCost } from '../core/cost.js';
import type { ComparisonResult } from '../core/types.js';

export function formatMarkdown(result: ComparisonResult): string {
	const lines: string[] = [];

	lines.push('# AI Model Comparison');
	lines.push('');
	lines.push(`**Prompt:** ${result.prompt}`);
	if (result.systemPrompt) {
		lines.push(`**System:** ${result.systemPrompt}`);
	}
	lines.push(`**Date:** ${result.createdAt}`);
	lines.push('');

	for (const r of result.responses) {
		lines.push(`## ${r.model.name} (${r.model.alias})`);
		lines.push('');
		if (r.status === 'success') {
			lines.push(r.output);
		} else {
			lines.push(`*${r.status}*${r.error ? `: ${r.error}` : ''}`);
		}
		lines.push('');
		lines.push(
			`> Time: ${(r.timing.totalMs / 1000).toFixed(2)}s | Tokens: ${r.usage.inputTokens}→${r.usage.outputTokens} | Cost: ${formatCost(r.cost.totalCost)}`,
		);
		lines.push('');
	}

	if (result.judge) {
		lines.push('## Judge Verdict');
		lines.push('');
		lines.push(`**Winner:** ${result.judge.winner}`);
		lines.push('');
		lines.push(result.judge.reasoning);
		lines.push('');
		for (const s of result.judge.scores) {
			lines.push(
				`- **${s.model}** (${s.score}/10): +${s.strengths.join(', ')}${s.weaknesses.length > 0 ? ` | -${s.weaknesses.join(', ')}` : ''}`,
			);
		}
		lines.push('');
	}

	lines.push('---');
	lines.push(
		`*Total cost: ${formatCost(result.totalCost)} | Time: ${(result.totalTimeMs / 1000).toFixed(2)}s*`,
	);

	return lines.join('\n');
}
