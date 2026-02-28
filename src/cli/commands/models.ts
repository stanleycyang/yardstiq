import chalk from 'chalk';
import { formatCost } from '../../core/cost.js';
import { MODEL_REGISTRY } from '../../core/models.js';
import { getAvailableProviders, isGatewayAvailable } from '../../providers/registry.js';

export async function listModels(): Promise<void> {
	const gatewayEnabled = isGatewayAvailable();
	const directKeys = getAvailableProviders();

	console.log(chalk.bold.cyan('\nAvailable Models\n'));

	if (gatewayEnabled) {
		console.log(
			chalk.green('  AI Gateway active') +
				chalk.dim(' — all models accessible via Vercel AI Gateway\n'),
		);
	} else {
		console.log(
			chalk.yellow('  AI Gateway not configured') +
				chalk.dim(' — set AI_GATEWAY_API_KEY for full access\n'),
		);
	}

	// Group models by provider
	const groups = new Map<string, [string, (typeof MODEL_REGISTRY)[string]][]>();
	for (const [alias, model] of Object.entries(MODEL_REGISTRY)) {
		const provider = model.modelId.split('/')[0] || 'other';
		if (!groups.has(provider)) groups.set(provider, []);
		groups.get(provider)?.push([alias, model]);
	}

	for (const [provider, models] of groups) {
		console.log(chalk.bold(`  ${providerLabel(provider)}`));

		for (const [alias, model] of models) {
			const input = formatCost(model.pricing.input);
			const output = formatCost(model.pricing.output);
			const pricing =
				model.pricing.input === 0 ? chalk.dim('free') : chalk.dim(`${input}/${output} per 1M tok`);

			let status: string;
			if (directKeys[provider]) {
				status = chalk.green('✓ key');
			} else if (gatewayEnabled) {
				status = chalk.green('✓ gw');
			} else {
				status = chalk.red('✗');
			}

			console.log(
				`    ${status} ${chalk.white(pad(alias, 22))}${chalk.dim(pad(model.name, 24))}${pricing}`,
			);
		}
		console.log('');
	}

	console.log(chalk.dim('  Ollama models: use "local:<model>" (e.g., local:llama3.2)'));
	console.log(
		chalk.dim('  Any gateway model: use "provider/model" (e.g., xai/grok-3, alibaba/qwen3-max)'),
	);

	if (!gatewayEnabled) {
		console.log(chalk.yellow('\n  Set API keys to access models:'));
		console.log(chalk.dim('    export AI_GATEWAY_API_KEY=your_key     (all models)'));
		console.log(chalk.dim('    export ANTHROPIC_API_KEY=sk-ant-...    (Claude models)'));
		console.log(chalk.dim('    export OPENAI_API_KEY=sk-...           (GPT models)'));
		console.log(chalk.dim('    export GOOGLE_GENERATIVE_AI_API_KEY=... (Gemini models)'));
	}

	console.log('');
}

function providerLabel(provider: string): string {
	const labels: Record<string, string> = {
		anthropic: 'Anthropic',
		openai: 'OpenAI',
		google: 'Google',
		deepseek: 'DeepSeek',
		mistral: 'Mistral',
		meta: 'Meta (Llama)',
		xai: 'xAI (Grok)',
		amazon: 'Amazon',
		cohere: 'Cohere',
		alibaba: 'Alibaba (Qwen)',
		moonshotai: 'Moonshot AI (Kimi)',
		minimax: 'MiniMax',
	};
	return labels[provider] || provider;
}

function pad(str: string, width: number): string {
	return str.padEnd(width);
}
