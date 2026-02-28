import chalk from 'chalk';
import { getConfig, getConfigValue, setConfigValue } from '../../storage/config.js';

export async function handleConfig(action: string, key?: string, value?: string): Promise<void> {
	if (action === 'list') {
		const config = getConfig();
		console.log(chalk.bold.cyan('\nCurrent Configuration\n'));
		console.log(JSON.stringify(config, null, 2));
		console.log('');
		return;
	}

	if (action === 'get') {
		if (!key) {
			console.error('Usage: yardstiq config get <key>');
			process.exit(1);
		}
		const val = getConfigValue(key);
		if (val) {
			console.log(val);
		} else {
			console.log(chalk.dim('(not set)'));
		}
		return;
	}

	if (action === 'set') {
		if (!key || !value) {
			console.error('Usage: yardstiq config set <key> <value>');
			console.error(
				'Keys: openai-key, anthropic-key, google-key, groq-key, deepseek-key, mistral-key',
			);
			console.error('      temperature, max-tokens, judge-model');
			process.exit(1);
		}
		setConfigValue(key, value);
		console.log(chalk.green(`Set ${key} successfully`));
		return;
	}

	console.error(`Unknown action: "${action}". Use: list, get, set`);
	process.exit(1);
}
