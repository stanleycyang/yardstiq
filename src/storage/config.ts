import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface AidiffConfig {
	keys?: {
		gateway?: string;
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

export function setConfigValue(key: string, value: string): void {
	const config = getConfig();

	if (key === 'gateway-key') {
		if (!config.keys) config.keys = {};
		config.keys.gateway = value;
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

	if (key === 'gateway-key') return config.keys?.gateway;
	if (key === 'temperature') return config.defaults?.temperature?.toString();
	if (key === 'max-tokens') return config.defaults?.maxTokens?.toString();
	if (key === 'judge-model') return config.defaults?.judgeModel;
	return undefined;
}
