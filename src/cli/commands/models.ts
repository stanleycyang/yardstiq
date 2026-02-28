import chalk from 'chalk';
import { formatCost } from '../../core/cost.js';
import { MODEL_REGISTRY } from '../../core/models.js';
import { getAvailableProviders, isGatewayAvailable } from '../../providers/registry.js';

export async function listModels(): Promise<void> {
	const available = getAvailableProviders();
	const gatewayEnabled = isGatewayAvailable();

	console.log(chalk.bold.cyan('\nAvailable Models\n'));

	if (gatewayEnabled) {
		console.log(
			chalk.green('  AI Gateway active') +
				chalk.dim(' — all models accessible via AI_GATEWAY_API_KEY\n'),
		);
	}

	console.log(
		`${chalk.bold(pad('Alias', 18))}${pad('Name', 22)}${pad('Provider', 12)}${pad('Input/1M', 10)}${pad('Output/1M', 10)}${pad('Status', 8)}`,
	);
	console.log('─'.repeat(80));

	for (const [alias, model] of Object.entries(MODEL_REGISTRY)) {
		const directKey = available.includes(model.provider);
		const status = directKey
			? chalk.green('✓ key')
			: gatewayEnabled
				? chalk.blue('✓ gw')
				: chalk.red('✗');

		console.log(
			`${pad(alias, 18)}${pad(model.name, 22)}${pad(model.provider, 12)}${pad(formatCost(model.pricing.input), 10)}${pad(formatCost(model.pricing.output), 10)}${status}`,
		);
	}

	console.log('');
	console.log(chalk.dim('✓ key = direct API key    ✓ gw = via AI Gateway    ✗ = no access'));
	console.log(chalk.dim('Ollama models: use "local:<model>" (e.g., local:llama3.2)'));
	console.log(chalk.dim('Gateway models: use "provider/model" (e.g., openai/gpt-5.2, xai/grok-3)'));

	if (!gatewayEnabled) {
		console.log(
			chalk.dim(
				'\nTip: Set AI_GATEWAY_API_KEY for one-key access to all models. Get one at https://vercel.com/ai-gateway',
			),
		);
	}

	console.log('');
}

function pad(str: string, width: number): string {
	return str.padEnd(width);
}
