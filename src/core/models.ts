import type { ModelConfig } from './types.js';

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
	// Anthropic
	'claude-sonnet': {
		name: 'Claude Sonnet',
		modelId: 'claude-sonnet-4-20250514',
		provider: 'anthropic',
		alias: 'claude-sonnet',
		pricing: { input: 3.0, output: 15.0 },
	},
	'claude-haiku': {
		name: 'Claude Haiku',
		modelId: 'claude-haiku-4-5-20251001',
		provider: 'anthropic',
		alias: 'claude-haiku',
		pricing: { input: 0.8, output: 4.0 },
	},
	'claude-opus': {
		name: 'Claude Opus',
		modelId: 'claude-opus-4-6',
		provider: 'anthropic',
		alias: 'claude-opus',
		pricing: { input: 15.0, output: 75.0 },
	},

	// OpenAI
	'gpt-4o': {
		name: 'GPT-4o',
		modelId: 'gpt-4o',
		provider: 'openai',
		alias: 'gpt-4o',
		pricing: { input: 2.5, output: 10.0 },
	},
	'gpt-4o-mini': {
		name: 'GPT-4o Mini',
		modelId: 'gpt-4o-mini',
		provider: 'openai',
		alias: 'gpt-4o-mini',
		pricing: { input: 0.15, output: 0.6 },
	},
	'gpt-4.1': {
		name: 'GPT-4.1',
		modelId: 'gpt-4.1',
		provider: 'openai',
		alias: 'gpt-4.1',
		pricing: { input: 2.0, output: 8.0 },
	},
	'gpt-4.1-mini': {
		name: 'GPT-4.1 Mini',
		modelId: 'gpt-4.1-mini',
		provider: 'openai',
		alias: 'gpt-4.1-mini',
		pricing: { input: 0.4, output: 1.6 },
	},
	'gpt-4.1-nano': {
		name: 'GPT-4.1 Nano',
		modelId: 'gpt-4.1-nano',
		provider: 'openai',
		alias: 'gpt-4.1-nano',
		pricing: { input: 0.1, output: 0.4 },
	},
	'o3-mini': {
		name: 'o3-mini',
		modelId: 'o3-mini',
		provider: 'openai',
		alias: 'o3-mini',
		pricing: { input: 1.1, output: 4.4 },
	},

	// Google
	'gemini-pro': {
		name: 'Gemini 2.0 Pro',
		modelId: 'gemini-2.0-pro',
		provider: 'google',
		alias: 'gemini-pro',
		pricing: { input: 1.25, output: 10.0 },
	},
	'gemini-flash': {
		name: 'Gemini 2.0 Flash',
		modelId: 'gemini-2.0-flash',
		provider: 'google',
		alias: 'gemini-flash',
		pricing: { input: 0.1, output: 0.4 },
	},

	// Groq
	llama3: {
		name: 'Llama 3.1 70B',
		modelId: 'llama-3.1-70b-versatile',
		provider: 'groq',
		alias: 'llama3',
		pricing: { input: 0.59, output: 0.79 },
	},

	// DeepSeek
	deepseek: {
		name: 'DeepSeek Chat',
		modelId: 'deepseek-chat',
		provider: 'deepseek',
		alias: 'deepseek',
		pricing: { input: 0.14, output: 0.28 },
	},

	// Mistral
	'mistral-large': {
		name: 'Mistral Large',
		modelId: 'mistral-large-latest',
		provider: 'mistral',
		alias: 'mistral-large',
		pricing: { input: 2.0, output: 6.0 },
	},
};

/** Maps our provider names to the AI Gateway provider prefix */
const PROVIDER_TO_GATEWAY_PREFIX: Record<string, string> = {
	anthropic: 'anthropic',
	openai: 'openai',
	google: 'google',
	groq: 'groq',
	deepseek: 'deepseek',
	mistral: 'mistral',
};

/**
 * Get the gateway model string ("provider/modelId") for a ModelConfig.
 * Used when routing through the Vercel AI Gateway.
 */
export function getGatewayModelId(config: ModelConfig): string {
	const prefix = PROVIDER_TO_GATEWAY_PREFIX[config.provider];
	if (!prefix) return config.modelId;
	return `${prefix}/${config.modelId}`;
}

/**
 * Resolve a model alias (or full model ID) to a ModelConfig.
 * Supports:
 *   - Registry aliases: "claude-sonnet" → Claude Sonnet config
 *   - Gateway format: "openai/gpt-5.2" → gateway provider config
 *   - Local models: "local:llama3.2" → Ollama config
 *   - Full model IDs: "claude-sonnet-4-20250514" → lookup by modelId
 */
export function resolveModel(input: string): ModelConfig {
	// Check for local (Ollama) prefix
	if (input.startsWith('local:')) {
		const modelName = input.slice(6);
		return {
			name: `Ollama: ${modelName}`,
			modelId: modelName,
			provider: 'ollama',
			alias: input,
			pricing: { input: 0, output: 0 },
		};
	}

	// Check for gateway format: "provider/model" (e.g. "openai/gpt-5.2", "anthropic/claude-sonnet-4.6")
	if (input.includes('/')) {
		const slashIdx = input.indexOf('/');
		const gatewayProvider = input.slice(0, slashIdx);
		const modelId = input.slice(slashIdx + 1);

		// See if this maps to a known registry entry (for pricing info)
		const knownEntry = Object.values(MODEL_REGISTRY).find(
			(m) => m.modelId === modelId && m.provider === gatewayProvider,
		);
		if (knownEntry) {
			return { ...knownEntry, provider: 'gateway', alias: input };
		}

		// Unknown model — route through gateway with zero pricing (we don't know the cost)
		return {
			name: `${gatewayProvider}/${modelId}`,
			modelId: input, // keep full "provider/model" as the modelId for gateway
			provider: 'gateway',
			alias: input,
			pricing: { input: 0, output: 0 },
		};
	}

	// Check alias registry
	if (MODEL_REGISTRY[input]) {
		return MODEL_REGISTRY[input];
	}

	// Check by full model ID
	const byModelId = Object.values(MODEL_REGISTRY).find((m) => m.modelId === input);
	if (byModelId) return byModelId;

	throw new Error(
		`Unknown model: "${input}". Use an alias (e.g. claude-sonnet), gateway format (e.g. openai/gpt-4o), or run "aidiff models".`,
	);
}
