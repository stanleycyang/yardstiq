import type { ModelConfig } from './types.js';

/**
 * Model registry with curated aliases for popular models.
 * All models route through the Vercel AI Gateway.
 * Pricing is per 1M tokens.
 *
 * Users can also use any gateway model directly via "provider/model" format
 * (e.g., "alibaba/qwen3.5-flash") even if it's not in this registry.
 */
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
	// ── Anthropic ──────────────────────────────────────────────
	'claude-sonnet': {
		name: 'Claude Sonnet 4.6',
		modelId: 'anthropic/claude-sonnet-4.6',
		provider: 'gateway',
		alias: 'claude-sonnet',
		pricing: { input: 3.0, output: 15.0 },
	},
	'claude-haiku': {
		name: 'Claude Haiku 4.5',
		modelId: 'anthropic/claude-haiku-4.5',
		provider: 'gateway',
		alias: 'claude-haiku',
		pricing: { input: 1.0, output: 5.0 },
	},
	'claude-opus': {
		name: 'Claude Opus 4.6',
		modelId: 'anthropic/claude-opus-4.6',
		provider: 'gateway',
		alias: 'claude-opus',
		pricing: { input: 5.0, output: 25.0 },
	},
	'claude-3.5-sonnet': {
		name: 'Claude 3.5 Sonnet',
		modelId: 'anthropic/claude-3.5-sonnet',
		provider: 'gateway',
		alias: 'claude-3.5-sonnet',
		pricing: { input: 3.0, output: 15.0 },
	},

	// ── OpenAI ─────────────────────────────────────────────────
	'gpt-4o': {
		name: 'GPT-4o',
		modelId: 'openai/gpt-4o',
		provider: 'gateway',
		alias: 'gpt-4o',
		pricing: { input: 2.5, output: 10.0 },
	},
	'gpt-4o-mini': {
		name: 'GPT-4o Mini',
		modelId: 'openai/gpt-4o-mini',
		provider: 'gateway',
		alias: 'gpt-4o-mini',
		pricing: { input: 0.15, output: 0.6 },
	},
	'gpt-4.1': {
		name: 'GPT-4.1',
		modelId: 'openai/gpt-4.1',
		provider: 'gateway',
		alias: 'gpt-4.1',
		pricing: { input: 2.0, output: 8.0 },
	},
	'gpt-4.1-mini': {
		name: 'GPT-4.1 Mini',
		modelId: 'openai/gpt-4.1-mini',
		provider: 'gateway',
		alias: 'gpt-4.1-mini',
		pricing: { input: 0.4, output: 1.6 },
	},
	'gpt-4.1-nano': {
		name: 'GPT-4.1 Nano',
		modelId: 'openai/gpt-4.1-nano',
		provider: 'gateway',
		alias: 'gpt-4.1-nano',
		pricing: { input: 0.1, output: 0.4 },
	},
	'gpt-5': {
		name: 'GPT-5',
		modelId: 'openai/gpt-5',
		provider: 'gateway',
		alias: 'gpt-5',
		pricing: { input: 1.25, output: 10.0 },
	},
	'gpt-5-mini': {
		name: 'GPT-5 Mini',
		modelId: 'openai/gpt-5-mini',
		provider: 'gateway',
		alias: 'gpt-5-mini',
		pricing: { input: 0.25, output: 2.0 },
	},
	'gpt-5-nano': {
		name: 'GPT-5 Nano',
		modelId: 'openai/gpt-5-nano',
		provider: 'gateway',
		alias: 'gpt-5-nano',
		pricing: { input: 0.05, output: 0.4 },
	},
	'o3-mini': {
		name: 'o3-mini',
		modelId: 'openai/o3-mini',
		provider: 'gateway',
		alias: 'o3-mini',
		pricing: { input: 1.1, output: 4.4 },
	},
	'codex-mini': {
		name: 'Codex Mini',
		modelId: 'openai/codex-mini',
		provider: 'gateway',
		alias: 'codex-mini',
		pricing: { input: 1.5, output: 6.0 },
	},

	// ── Google ──────────────────────────────────────────────────
	'gemini-pro': {
		name: 'Gemini 2.5 Pro',
		modelId: 'google/gemini-2.5-pro',
		provider: 'gateway',
		alias: 'gemini-pro',
		pricing: { input: 1.25, output: 10.0 },
	},
	'gemini-flash': {
		name: 'Gemini 2.5 Flash',
		modelId: 'google/gemini-2.5-flash',
		provider: 'gateway',
		alias: 'gemini-flash',
		pricing: { input: 0.3, output: 2.5 },
	},
	'gemini-flash-lite': {
		name: 'Gemini 2.5 Flash Lite',
		modelId: 'google/gemini-2.5-flash-lite',
		provider: 'gateway',
		alias: 'gemini-flash-lite',
		pricing: { input: 0.1, output: 0.4 },
	},
	'gemini-3-flash': {
		name: 'Gemini 3 Flash',
		modelId: 'google/gemini-3-flash',
		provider: 'gateway',
		alias: 'gemini-3-flash',
		pricing: { input: 0.5, output: 3.0 },
	},
	'gemini-3-pro': {
		name: 'Gemini 3 Pro',
		modelId: 'google/gemini-3-pro-preview',
		provider: 'gateway',
		alias: 'gemini-3-pro',
		pricing: { input: 2.0, output: 12.0 },
	},

	// ── DeepSeek ────────────────────────────────────────────────
	deepseek: {
		name: 'DeepSeek V3.2',
		modelId: 'deepseek/deepseek-v3.2',
		provider: 'gateway',
		alias: 'deepseek',
		pricing: { input: 0.26, output: 0.38 },
	},
	'deepseek-r1': {
		name: 'DeepSeek R1',
		modelId: 'deepseek/deepseek-r1',
		provider: 'gateway',
		alias: 'deepseek-r1',
		pricing: { input: 0.5, output: 2.15 },
	},

	// ── Mistral ─────────────────────────────────────────────────
	'mistral-large': {
		name: 'Mistral Large 3',
		modelId: 'mistral/mistral-large-3',
		provider: 'gateway',
		alias: 'mistral-large',
		pricing: { input: 0.5, output: 1.5 },
	},
	'magistral-medium': {
		name: 'Magistral Medium',
		modelId: 'mistral/magistral-medium',
		provider: 'gateway',
		alias: 'magistral-medium',
		pricing: { input: 2.0, output: 5.0 },
	},
	'magistral-small': {
		name: 'Magistral Small',
		modelId: 'mistral/magistral-small',
		provider: 'gateway',
		alias: 'magistral-small',
		pricing: { input: 0.5, output: 1.5 },
	},
	codestral: {
		name: 'Codestral',
		modelId: 'mistral/codestral',
		provider: 'gateway',
		alias: 'codestral',
		pricing: { input: 0.3, output: 0.9 },
	},

	// ── Meta (Llama) ────────────────────────────────────────────
	'llama-4-maverick': {
		name: 'Llama 4 Maverick',
		modelId: 'meta/llama-4-maverick',
		provider: 'gateway',
		alias: 'llama-4-maverick',
		pricing: { input: 0.15, output: 0.6 },
	},
	'llama-4-scout': {
		name: 'Llama 4 Scout',
		modelId: 'meta/llama-4-scout',
		provider: 'gateway',
		alias: 'llama-4-scout',
		pricing: { input: 0.08, output: 0.3 },
	},
	'llama-3.3-70b': {
		name: 'Llama 3.3 70B',
		modelId: 'meta/llama-3.3-70b',
		provider: 'gateway',
		alias: 'llama-3.3-70b',
		pricing: { input: 0.72, output: 0.72 },
	},

	// ── xAI (Grok) ──────────────────────────────────────────────
	'grok-3': {
		name: 'Grok 3',
		modelId: 'xai/grok-3',
		provider: 'gateway',
		alias: 'grok-3',
		pricing: { input: 3.0, output: 15.0 },
	},

	// ── Amazon ──────────────────────────────────────────────────
	'nova-pro': {
		name: 'Nova Pro',
		modelId: 'amazon/nova-pro',
		provider: 'gateway',
		alias: 'nova-pro',
		pricing: { input: 0.8, output: 3.2 },
	},
	'nova-lite': {
		name: 'Nova Lite',
		modelId: 'amazon/nova-lite',
		provider: 'gateway',
		alias: 'nova-lite',
		pricing: { input: 0.06, output: 0.24 },
	},

	// ── Cohere ──────────────────────────────────────────────────
	'command-a': {
		name: 'Command A',
		modelId: 'cohere/command-a',
		provider: 'gateway',
		alias: 'command-a',
		pricing: { input: 2.5, output: 10.0 },
	},

	// ── Alibaba (Qwen) ─────────────────────────────────────────
	'qwen3.5-flash': {
		name: 'Qwen 3.5 Flash',
		modelId: 'alibaba/qwen3.5-flash',
		provider: 'gateway',
		alias: 'qwen3.5-flash',
		pricing: { input: 0.1, output: 0.4 },
	},
	'qwen3.5-plus': {
		name: 'Qwen 3.5 Plus',
		modelId: 'alibaba/qwen3.5-plus',
		provider: 'gateway',
		alias: 'qwen3.5-plus',
		pricing: { input: 0.4, output: 2.4 },
	},

	// ── Moonshot (Kimi) ─────────────────────────────────────────
	'kimi-k2': {
		name: 'Kimi K2',
		modelId: 'moonshotai/kimi-k2',
		provider: 'gateway',
		alias: 'kimi-k2',
		pricing: { input: 0.5, output: 2.0 },
	},
	'kimi-k2.5': {
		name: 'Kimi K2.5',
		modelId: 'moonshotai/kimi-k2.5',
		provider: 'gateway',
		alias: 'kimi-k2.5',
		pricing: { input: 0.5, output: 2.8 },
	},

	// ── MiniMax ─────────────────────────────────────────────────
	'minimax-m2.5': {
		name: 'MiniMax M2.5',
		modelId: 'minimax/minimax-m2.5',
		provider: 'gateway',
		alias: 'minimax-m2.5',
		pricing: { input: 0.3, output: 1.2 },
	},
};

/**
 * Resolve a model alias (or full model ID) to a ModelConfig.
 * Supports:
 *   - Registry aliases: "claude-sonnet" -> Claude Sonnet config
 *   - Gateway format: "openai/gpt-5.2" -> gateway provider config
 *   - Local models: "local:llama3.2" -> Ollama config
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

	// Check for gateway format: "provider/model" (e.g. "openai/gpt-5.2")
	if (input.includes('/')) {
		// See if this maps to a known registry entry (for pricing info)
		const knownEntry = Object.values(MODEL_REGISTRY).find((m) => m.modelId === input);
		if (knownEntry) {
			return { ...knownEntry, alias: input };
		}

		// Unknown model — route through gateway with zero pricing (we don't know the cost)
		const slashIdx = input.indexOf('/');
		const provider = input.slice(0, slashIdx);
		const modelId = input.slice(slashIdx + 1);
		return {
			name: `${provider}/${modelId}`,
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

	// Check by full model ID (e.g., "anthropic/claude-sonnet-4.6")
	const byModelId = Object.values(MODEL_REGISTRY).find((m) => m.modelId === input);
	if (byModelId) return byModelId;

	throw new Error(
		`Unknown model: "${input}". Use an alias (e.g. claude-sonnet), gateway format (e.g. openai/gpt-5.2), or run "yardstiq models".`,
	);
}
