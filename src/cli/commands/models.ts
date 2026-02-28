import chalk from 'chalk';
import { formatCost } from '../../core/cost.js';
import { MODEL_REGISTRY } from '../../core/models.js';
import { isGatewayAvailable } from '../../providers/registry.js';

export async function listModels(): Promise<void> {
	const gatewayEnabled = isGatewayAvailable();

	console.log(chalk.bold.cyan('\nAvailable Models\n'));

	if (gatewayEnabled) {
		console.log(
			chalk.green('  AI Gateway active') +
				chalk.dim(' — all models accessible via Vercel AI Gateway\n'),
		);
	} else {
		console.log(
			chalk.red('  AI Gateway not configured') +
				chalk.dim(' — set AI_GATEWAY_API_KEY to access models\n'),
		);
	}

	// Group models by provider
	const groups = new Map<string, [string, typeof MODEL_REGISTRY[string]][]>();
	for (const [alias, model] of Object.entries(MODEL_REGISTRY)) {
		const provider = model.modelId.split('/')[0] || 'other';
		if (!groups.has(provider)) groups.set(provider, []);
		groups.get(provider)!.push([alias, model]);
	}

	for (const [provider, models] of groups) {
		console.log(chalk.bold(`  ${providerLabel(provider)}`));

		for (const [alias, model] of models) {
			const input = formatCost(model.pricing.input);
			const output = formatCost(model.pricing.output);
			const pricing = model.pricing.input === 0
				? chalk.dim('free')
				: chalk.dim(`${input}/${output} per 1M tok`);
			const status = gatewayEnabled ? chalk.green('✓') : chalk.red('✗');

			console.log(
				`    ${status} ${chalk.white(pad(alias, 22))}${chalk.dim(pad(model.name, 24))}${pricing}`,
			);
		}
		console.log('');
	}

	console.log(chalk.dim('  Ollama models: use "local:<model>" (e.g., local:llama3.2)'));
	console.log(chalk.dim('  Any gateway model: use "provider/model" (e.g., xai/grok-3, alibaba/qwen3-max)'));

	if (!gatewayEnabled) {
		console.log(
			chalk.yellow(
				'\n  Set AI_GATEWAY_API_KEY to access all models:',
			),
		);
		console.log(chalk.dim('    export AI_GATEWAY_API_KEY=your_key'));
		console.log(chalk.dim('    Get one at https://vercel.com/ai-gateway'));
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
