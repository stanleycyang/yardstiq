import chalk from 'chalk';
import { CONFIG_TO_ENV, getConfig, saveConfig } from '../../storage/config.js';

interface Provider {
	id: string;
	label: string;
	description: string;
	configKey: string;
}

const PROVIDERS: Provider[] = [
	{
		id: 'gateway',
		label: 'AI Gateway (Vercel)',
		description: 'access all models with one key',
		configKey: 'gateway',
	},
	{
		id: 'anthropic',
		label: 'Anthropic',
		description: 'Claude models (direct)',
		configKey: 'anthropic',
	},
	{
		id: 'openai',
		label: 'OpenAI',
		description: 'GPT models (direct)',
		configKey: 'openai',
	},
	{
		id: 'google',
		label: 'Google',
		description: 'Gemini models (direct)',
		configKey: 'google',
	},
];

function isConfigured(provider: Provider, config: ReturnType<typeof getConfig>): boolean {
	return !!(config.keys as Record<string, string> | undefined)?.[provider.configKey];
}

export async function handleSetup(options: { provider?: string }): Promise<void> {
	if (!process.stdin.isTTY) {
		console.error(
			'Error: yardstiq setup requires an interactive terminal.\nUse "yardstiq config set <key> <value>" instead.',
		);
		process.exit(1);
	}

	const { checkbox, password, confirm } = await import('@inquirer/prompts');
	const config = getConfig();

	console.log('');
	console.log(chalk.bold.cyan('  Yardstiq Setup'));
	console.log(chalk.dim('  Configure API keys for AI model providers.'));
	console.log(chalk.dim(`  Keys stored in ~/.yardstiq/config.json, loaded automatically.`));
	console.log(chalk.dim('  Environment variables always take priority.'));
	console.log('');

	let selectedProviders: Provider[];

	if (options.provider) {
		const match = PROVIDERS.find((p) => p.id === options.provider);
		if (!match) {
			console.error(
				`Error: Unknown provider "${options.provider}". Valid providers: ${PROVIDERS.map((p) => p.id).join(', ')}`,
			);
			process.exit(1);
		}
		selectedProviders = [match];
	} else {
		const choices = PROVIDERS.map((p) => {
			const configured = isConfigured(p, config);
			const suffix = configured ? chalk.green(' [configured]') : '';
			return {
				name: `${p.label} — ${p.description}${suffix}`,
				value: p.id,
				checked: p.id === 'gateway' && !configured,
			};
		});

		const selected = await checkbox({
			message: 'Which providers do you want to configure?',
			choices,
		});

		if (selected.length === 0) {
			console.log(chalk.dim('\n  No providers selected. Nothing to do.\n'));
			return;
		}

		selectedProviders = selected
			.map((id) => PROVIDERS.find((p) => p.id === id))
			.filter((p): p is Provider => p !== undefined);
	}

	let configured = 0;

	for (const provider of selectedProviders) {
		const alreadySet = isConfigured(provider, config);

		if (alreadySet) {
			const replace = await confirm({
				message: `${provider.label} key is already configured. Replace it?`,
				default: false,
			});
			if (!replace) {
				console.log(chalk.dim(`  Skipped ${provider.label}.`));
				continue;
			}
		}

		const key = await password({
			message: `${provider.label} API key:`,
			mask: '*',
		});

		if (!key) {
			console.log(chalk.dim(`  Skipped ${provider.label} (empty input).`));
			continue;
		}

		if (!config.keys) config.keys = {};
		(config.keys as Record<string, string>)[provider.configKey] = key;
		process.env[CONFIG_TO_ENV[provider.configKey]] = key;
		configured++;
		console.log(chalk.green(`  Saved ${provider.label} key.`));
	}

	if (configured > 0) {
		saveConfig(config);
	}

	console.log('');
	if (configured > 0) {
		console.log(
			chalk.bold.green(
				`  Setup complete! ${configured} provider key${configured > 1 ? 's' : ''} configured.`,
			),
		);
	} else {
		console.log(chalk.dim('  No keys were configured.'));
	}

	console.log('');
	console.log(chalk.dim('  Test your setup:'));
	console.log(chalk.dim('    yardstiq models'));
	console.log(chalk.dim('    yardstiq "hello" -m claude-sonnet -m gpt-4o'));
	console.log('');
}
