import { judgeComparison } from '../core/judge.js';
import { resolveModel } from '../core/models.js';
import { runComparison } from '../core/runner.js';
import type { BenchmarkReport, BenchmarkSuite, ComparisonResult } from '../core/types.js';
import { resolveProvider } from '../providers/registry.js';
import { parseBenchmarkFile } from './parser.js';

export interface BenchmarkCallbacks {
	onSuiteStart?: (suite: BenchmarkSuite, totalPrompts: number) => void;
	onPromptStart?: (index: number, total: number, promptName: string) => void;
	onPromptComplete?: (index: number, result: ComparisonResult) => void;
	onJudgeResult?: (index: number, winner: string) => void;
	onExpectedMissing?: (promptName: string, model: string, missing: string[]) => void;
	onJudgeError?: (index: number, error: Error) => void;
}

export async function runBenchmarkSuite(
	filePath: string,
	callbacks?: BenchmarkCallbacks,
): Promise<BenchmarkReport> {
	const suite = parseBenchmarkFile(filePath);
	const models = suite.models.map(resolveModel);

	// Validate API keys upfront
	for (const model of models) {
		resolveProvider(model);
	}

	callbacks?.onSuiteStart?.(suite, suite.prompts.length);

	const results: ComparisonResult[] = [];
	const startTime = Date.now();

	for (let i = 0; i < suite.prompts.length; i++) {
		const bp = suite.prompts[i];
		callbacks?.onPromptStart?.(i, suite.prompts.length, bp.name);

		const result = await runComparison({
			prompt: bp.prompt,
			systemPrompt: bp.system,
			models,
			options: {
				temperature: 0,
				maxTokens: bp.maxTokens ?? 2048,
				stream: false,
				timeout: 120,
			},
		});

		// Judge if enabled
		if (suite.judge?.enabled) {
			try {
				result.judge = await judgeComparison(result, {
					judgeModel: suite.judge.model,
					criteria: bp.criteria ?? suite.judge.criteria,
				});
				callbacks?.onJudgeResult?.(i, result.judge.winner);
			} catch (err) {
				callbacks?.onJudgeError?.(i, err as Error);
			}
		}

		// Check expectedContains
		if (bp.expectedContains) {
			for (const response of result.responses) {
				if (response.status !== 'success') continue;
				const missing = bp.expectedContains.filter((s) => !response.output.includes(s));
				if (missing.length > 0) {
					callbacks?.onExpectedMissing?.(bp.name, response.model.alias, missing);
				}
			}
		}

		callbacks?.onPromptComplete?.(i, result);
		results.push(result);
	}

	const totalTimeMs = Date.now() - startTime;
	const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);

	// Build per-model summary
	const modelStats = new Map<
		string,
		{ wins: number; scores: number[]; times: number[]; costs: number[] }
	>();

	for (const alias of suite.models) {
		modelStats.set(alias, { wins: 0, scores: [], times: [], costs: [] });
	}

	for (const result of results) {
		if (result.judge) {
			const stats = modelStats.get(result.judge.winner);
			if (stats) stats.wins++;
		}

		for (const response of result.responses) {
			const stats = modelStats.get(response.model.alias);
			if (!stats) continue;
			stats.times.push(response.timing.totalMs);
			stats.costs.push(response.cost.totalCost);

			if (result.judge) {
				const score = result.judge.scores.find((s) => s.model === response.model.alias);
				if (score) stats.scores.push(score.score);
			}
		}
	}

	const summary = Array.from(modelStats.entries())
		.map(([model, stats]) => ({
			model,
			wins: stats.wins,
			avgScore:
				stats.scores.length > 0 ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : 0,
			avgTimeMs:
				stats.times.length > 0 ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length : 0,
			avgCost:
				stats.costs.length > 0 ? stats.costs.reduce((a, b) => a + b, 0) / stats.costs.length : 0,
			totalCost: stats.costs.reduce((a, b) => a + b, 0),
		}))
		.sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore);

	return {
		suite: suite.name,
		results,
		summary,
		totalCost,
		totalTimeMs,
	};
}
