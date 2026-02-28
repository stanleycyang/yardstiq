import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: [
				'src/core/cost.ts',
				'src/core/models.ts',
				'src/core/runner.ts',
				'src/core/judge.ts',
				'src/providers/registry.ts',
				'src/output/json.ts',
				'src/output/markdown.ts',
				'src/output/html.ts',
				'src/storage/config.ts',
				'src/storage/history.ts',
				'src/bench/parser.ts',
				'src/bench/runner.ts',
			],
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100,
			},
		},
	},
});
