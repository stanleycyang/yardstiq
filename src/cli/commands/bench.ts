import { existsSync } from 'node:fs';
import chalk from 'chalk';
import type { BenchmarkCallbacks } from '../../bench/runner.js';

function resolveFile(file: string): string {
	if (existsSync(file)) return file;
	const withDir = `benchmarks/${file}`;
	if (existsSync(withDir)) return withDir;
	const withExt = `benchmarks/${file}.yaml`;
	if (existsSync(withExt)) return withExt;
	throw new Error(`Benchmark file not found: ${file}`);
}

export async function runBenchmark(
	file: string,
	options: { save?: string | boolean; json?: boolean },
): Promise<void> {
	const filePath = resolveFile(file);
	const { runBenchmarkSuite } = await import('../../bench/runner.js');

	const callbacks: BenchmarkCallbacks = options.json
		? {}
		: {
				onSuiteStart: (suite, total) => {
					console.log(chalk.bold(`\nBenchmark: ${suite.name}`));
					if (suite.description) console.log(chalk.dim(suite.description));
					console.log(chalk.dim(`Models: ${suite.models.join(', ')}`));
					console.log(chalk.dim(`Prompts: ${total}\n`));
				},
				onPromptStart: (index, total, name) => {
					process.stdout.write(chalk.cyan(`[${index + 1}/${total}] `) + name + chalk.dim('...'));
				},
				onPromptComplete: () => {
					/* newline after judge or just done */
				},
				onJudgeResult: (_index, winner) => {
					console.log(chalk.dim(' → ') + chalk.green(`Winner: ${winner}`));
				},
				onExpectedMissing: (promptName, model, missing) => {
					console.log(
						chalk.yellow(`  ⚠ ${model} missing expected: ${missing.join(', ')} (${promptName})`),
					);
				},
				onJudgeError: (_index, error) => {
					console.log(chalk.dim(' → ') + chalk.red(`Judge error: ${error.message}`));
				},
			};

	// If no judge result callback fires, we still need a newline after prompt
	const originalOnPromptComplete = callbacks.onPromptComplete;
	let judgeResultFired = false;
	callbacks.onJudgeResult = ((orig) => {
		return (index: number, winner: string) => {
			judgeResultFired = true;
			orig?.(index, winner);
		};
	})(callbacks.onJudgeResult);
	callbacks.onJudgeError = ((orig) => {
		return (index: number, error: Error) => {
			judgeResultFired = true;
			orig?.(index, error);
		};
	})(callbacks.onJudgeError);
	callbacks.onPromptComplete = (index, result) => {
		if (!judgeResultFired && !options.json) {
			console.log(chalk.dim(' done'));
		}
		judgeResultFired = false;
		originalOnPromptComplete?.(index, result);
	};

	const report = await runBenchmarkSuite(filePath, callbacks);

	if (options.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	// Summary table
	console.log(chalk.bold('\n─── Results ───\n'));
	console.log(
		chalk.dim(
			`${'Rank'.padEnd(6)}${'Model'.padEnd(20)}${'Wins'.padEnd(8)}${'Avg Score'.padEnd(12)}${'Avg Time'.padEnd(12)}${'Total Cost'.padEnd(12)}`,
		),
	);
	console.log(chalk.dim('─'.repeat(70)));

	for (let i = 0; i < report.summary.length; i++) {
		const s = report.summary[i];
		const rank = `#${i + 1}`.padEnd(6);
		const model = s.model.padEnd(20);
		const wins = String(s.wins).padEnd(8);
		const avgScore = s.avgScore > 0 ? s.avgScore.toFixed(1).padEnd(12) : '—'.padEnd(12);
		const avgTime = `${(s.avgTimeMs / 1000).toFixed(1)}s`.padEnd(12);
		const totalCost = `$${s.totalCost.toFixed(4)}`.padEnd(12);
		const line = `${rank}${model}${wins}${avgScore}${avgTime}${totalCost}`;
		console.log(i === 0 ? chalk.green(line) : line);
	}

	console.log(
		chalk.dim(
			`\nTotal: $${report.totalCost.toFixed(4)} | ${(report.totalTimeMs / 1000).toFixed(1)}s`,
		),
	);

	if (options.save) {
		const { saveResult } = await import('../../storage/history.js');
		for (const result of report.results) {
			saveResult(result, typeof options.save === 'string' ? options.save : undefined);
		}
		console.log(chalk.dim('\nResults saved to history.'));
	}
}
