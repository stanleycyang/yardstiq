import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface AidiffConfig {
	keys?: {
		gateway?: string;
		anthropic?: string;
		openai?: string;
		google?: string;
	};
	defaults?: {
		models?: string[];
		temperature?: number;
		maxTokens?: number;
		judgeModel?: string;
	};
}

const CONFIG_DIR = join(homedir(), '.yardstiq');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}
}

export function getConfig(): AidiffConfig {
	try {
		const raw = readFileSync(CONFIG_FILE, 'utf-8');
		return JSON.parse(raw) as AidiffConfig;
	} catch {
		return {};
	}
}

export function saveConfig(config: AidiffConfig): void {
	ensureConfigDir();
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/** Maps config key names to environment variable names */
export const CONFIG_TO_ENV: Record<string, string> = {
	gateway: 'AI_GATEWAY_API_KEY',
	anthropic: 'ANTHROPIC_API_KEY',
	openai: 'OPENAI_API_KEY',
	google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

/**
 * Loads API keys from config file into process.env.
 * Env vars already set take priority (never overwritten).
 */
export function loadConfigKeys(): void {
	const config = getConfig();
	if (!config.keys) return;

	for (const [configKey, envVar] of Object.entries(CONFIG_TO_ENV)) {
		const value = (config.keys as Record<string, string>)[configKey];
		if (value && !process.env[envVar]) {
			process.env[envVar] = value;
		}
	}
}

/** Keys that map to config.keys.* */
const KEY_MAP: Record<string, string> = {
	'gateway-key': 'gateway',
	'anthropic-key': 'anthropic',
	'openai-key': 'openai',
	'google-key': 'google',
};

export function setConfigValue(key: string, value: string): void {
	const config = getConfig();

	const keyField = KEY_MAP[key];
	if (keyField) {
		if (!config.keys) config.keys = {};
		(config.keys as Record<string, string>)[keyField] = value;
	} else {
		if (!config.defaults) config.defaults = {};
		if (key === 'temperature') {
			config.defaults.temperature = Number.parseFloat(value);
		} else if (key === 'max-tokens') {
			config.defaults.maxTokens = Number.parseInt(value, 10);
		} else if (key === 'judge-model') {
			config.defaults.judgeModel = value;
		}
	}

	saveConfig(config);
}

export function getConfigValue(key: string): string | undefined {
	const config = getConfig();

	const keyField = KEY_MAP[key];
	if (keyField) {
		return (config.keys as Record<string, string> | undefined)?.[keyField];
	}
	if (key === 'temperature') return config.defaults?.temperature?.toString();
	if (key === 'max-tokens') return config.defaults?.maxTokens?.toString();
	if (key === 'judge-model') return config.defaults?.judgeModel;
	return undefined;
}
