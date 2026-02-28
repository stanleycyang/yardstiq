import chalk from 'chalk';
import { formatCost } from '../../core/cost.js';
import { listHistory, loadResult } from '../../storage/history.js';

export async function handleHistory(action?: string, name?: string): Promise<void> {
	if (!action || action === 'list') {
		const entries = listHistory();
		if (entries.length === 0) {
			console.log(chalk.dim('\nNo saved comparisons. Use --save to save a comparison.\n'));
			return;
		}

		console.log(chalk.bold.cyan('\nSaved Comparisons\n'));
		for (const entry of entries) {
			console.log(`  ${chalk.bold(entry.name)}`);
			console.log(`    ${chalk.dim(entry.date)} — ${entry.prompt}`);
		}
		console.log('');
		return;
	}

	if (action === 'show') {
		if (!name) {
			console.error('Usage: aidiff history show <name>');
			process.exit(1);
		}

		const result = loadResult(name);
		if (!result) {
			console.error(`No saved comparison found: "${name}"`);
			process.exit(1);
		}

		console.log(chalk.bold.cyan(`\nComparison: ${name}\n`));
		console.log(`Prompt: ${result.prompt}`);
		console.log(`Date: ${result.createdAt}`);
		console.log(`Total cost: ${formatCost(result.totalCost)}\n`);

		for (const r of result.responses) {
			console.log(chalk.bold(`─── ${r.model.name} (${r.status}) ───`));
			console.log(r.status === 'success' ? r.output : `Error: ${r.error}`);
			console.log(
				chalk.dim(
					`Time: ${(r.timing.totalMs / 1000).toFixed(2)}s | Tokens: ${r.usage.inputTokens}→${r.usage.outputTokens} | Cost: ${formatCost(r.cost.totalCost)}`,
				),
			);
			console.log('');
		}

		if (result.judge) {
			console.log(chalk.bold.yellow(`Winner: ${result.judge.winner}`));
			console.log(result.judge.reasoning);
		}
		return;
	}

	console.error(`Unknown action: "${action}". Use: list, show`);
	process.exit(1);
}
