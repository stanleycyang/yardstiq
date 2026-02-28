import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { resolveModel } from '../core/models.js';
import { isGatewayAvailable } from '../providers/registry.js';

const require = createRequire(import.meta.url);
// Path is relative to bundled dist/index.js, not the source file
const { version } = require('../package.json');

const program = new Command();

program
	.name('yardstiq')
	.description('Compare AI model outputs side-by-side in your terminal')
	.version(version)
	.argument('[prompt...]', 'The prompt to send to all models')
	.option('-m, --model <models...>', 'Models to compare (at least 2)')
	.option('-s, --system <message>', 'System prompt for all models')
	.option('-f, --file <path>', 'Read prompt from file')
	.option('-t, --temperature <n>', 'Temperature', parseFloat, 0)
	.option('--max-tokens <n>', 'Max tokens per response', parseInt, 2048)
	.option('--judge', 'Use AI judge to evaluate responses')
	.option('--judge-model <model>', 'Model for judging', 'claude-sonnet')
	.option('--judge-criteria <text>', 'Custom judging criteria')
	.option('--no-stream', 'Disable streaming')
	.option('--json', 'Output as JSON')
	.option('--markdown', 'Output as Markdown')
	.option('--html', 'Output as HTML')
	.option('--save [name]', 'Save results to history')
	.option('--timeout <seconds>', 'Timeout per model', parseInt, 60)
	.option('-v, --verbose', 'Show debug info')
	.action(async (promptParts: string[], options) => {
		let prompt: string;

		if (options.file) {
			prompt = readFileSync(options.file, 'utf-8').trim();
		} else if (promptParts.length > 0) {
			prompt = promptParts.join(' ');
		} else if (!process.stdin.isTTY) {
			const chunks: Buffer[] = [];
			for await (const chunk of process.stdin) {
				chunks.push(chunk as Buffer);
			}
			prompt = Buffer.concat(chunks).toString('utf-8').trim();
		} else {
			console.error('Error: No prompt provided. Use yardstiq "your prompt" or pipe via stdin.');
			process.exit(1);
		}

		if (!options.model || options.model.length < 2) {
			console.error('Error: At least 2 models required. Use -m model1 -m model2');
			process.exit(1);
		}

		const models = (options.model as string[]).map(resolveModel);

		// Validate gateway key for non-local models
		const needsGateway = models.some((m) => m.provider !== 'ollama');
		if (needsGateway && !isGatewayAvailable()) {
			console.error('Error: AI_GATEWAY_API_KEY not set. Get one at https://vercel.com/ai-gateway');
			process.exit(1);
		}

		const request = {
			prompt,
			systemPrompt: options.system as string | undefined,
			models,
			options: {
				temperature: options.temperature as number,
				maxTokens: options.maxTokens as number,
				stream: options.stream !== false,
				timeout: options.timeout as number,
			},
		};

		// Non-interactive output formats
		if (options.json || options.markdown || options.html) {
			const { runComparison } = await import('../core/runner.js');
			const result = await runComparison(request);

			if (options.judge) {
				const { judgeComparison } = await import('../core/judge.js');
				result.judge = await judgeComparison(result, {
					judgeModel: options.judgeModel as string,
					criteria: options.judgeCriteria as string | undefined,
				});
			}

			if (options.json) {
				const { formatJSON } = await import('../output/json.js');
				console.log(formatJSON(result));
			} else if (options.markdown) {
				const { formatMarkdown } = await import('../output/markdown.js');
				console.log(formatMarkdown(result));
			} else if (options.html) {
				const { formatHTML } = await import('../output/html.js');
				console.log(formatHTML(result));
			}

			if (options.save) {
				const { saveResult } = await import('../storage/history.js');
				saveResult(result, typeof options.save === 'string' ? options.save : undefined);
			}
			return;
		}

		// Interactive terminal UI
		const { renderApp } = await import('../ui/App.js');
		renderApp({
			request,
			showJudge: !!options.judge,
			judgeModel: options.judgeModel as string,
			judgeCriteria: options.judgeCriteria as string | undefined,
		});
	});

// Subcommands
program
	.command('models')
	.description('List available models and pricing')
	.action(async () => {
		const { listModels } = await import('./commands/models.js');
		await listModels();
	});

program
	.command('history')
	.description('Browse saved comparisons')
	.argument('[action]', 'show, list, or clear')
	.argument('[name]', 'comparison name')
	.action(async (action?: string, name?: string) => {
		const { handleHistory } = await import('./commands/history.js');
		await handleHistory(action, name);
	});

program
	.command('config')
	.description('Manage configuration')
	.argument('<action>', 'set, get, or list')
	.argument('[key]', 'config key')
	.argument('[value]', 'config value')
	.action(async (action: string, key?: string, value?: string) => {
		const { handleConfig } = await import('./commands/config.js');
		await handleConfig(action, key, value);
	});

program
	.command('bench')
	.description('Run a benchmark suite')
	.argument('<file>', 'path to benchmark YAML file')
	.option('--save [name]', 'Save benchmark results')
	.option('--json', 'Output results as JSON')
	.action(async (file: string, options: { save?: string | boolean; json?: boolean }) => {
		const { runBenchmark } = await import('./commands/bench.js');
		await runBenchmark(file, options);
	});

program.parse();
