import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { gateway as aiGateway } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { getGatewayModelId } from '../core/models.js';
import type { ModelConfig } from '../core/types.js';

// biome-ignore lint/suspicious/noExplicitAny: Provider return types vary across SDK packages
type ProviderFactory = (modelId: string) => any;

/**
 * Check if the Vercel AI Gateway is configured.
 */
export function isGatewayAvailable(): boolean {
	return !!process.env.AI_GATEWAY_API_KEY;
}

const providers: Record<string, () => ProviderFactory> = {
	anthropic: () => {
		const key = process.env.ANTHROPIC_API_KEY;
		if (!key)
			throw new Error('ANTHROPIC_API_KEY not set. Run: export ANTHROPIC_API_KEY=sk-ant-...');
		return createAnthropic({ apiKey: key }) as unknown as ProviderFactory;
	},

	openai: () => {
		const key = process.env.OPENAI_API_KEY;
		if (!key) throw new Error('OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=sk-...');
		return createOpenAI({ apiKey: key }) as unknown as ProviderFactory;
	},

	google: () => {
		const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
		if (!key) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set.');
		return createGoogleGenerativeAI({ apiKey: key }) as unknown as ProviderFactory;
	},

	groq: () => {
		const key = process.env.GROQ_API_KEY;
		if (!key) throw new Error('GROQ_API_KEY not set.');
		return createOpenAI({
			apiKey: key,
			baseURL: 'https://api.groq.com/openai/v1',
		}) as unknown as ProviderFactory;
	},

	deepseek: () => {
		const key = process.env.DEEPSEEK_API_KEY;
		if (!key) throw new Error('DEEPSEEK_API_KEY not set.');
		return createOpenAI({
			apiKey: key,
			baseURL: 'https://api.deepseek.com',
		}) as unknown as ProviderFactory;
	},

	mistral: () => {
		const key = process.env.MISTRAL_API_KEY;
		if (!key) throw new Error('MISTRAL_API_KEY not set.');
		return createOpenAI({
			apiKey: key,
			baseURL: 'https://api.mistral.ai/v1',
		}) as unknown as ProviderFactory;
	},

	ollama: () => {
		const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
		return createOllama({ baseURL: baseUrl }) as unknown as ProviderFactory;
	},

	gateway: () => {
		if (!process.env.AI_GATEWAY_API_KEY) {
			throw new Error('AI_GATEWAY_API_KEY not set. Get one at https://vercel.com/ai-gateway');
		}
		return aiGateway as unknown as ProviderFactory;
	},
};

// Cache initialized providers
const cache = new Map<string, ProviderFactory>();

/**
 * Get a provider factory by name.
 * For non-gateway/non-ollama providers, falls back to the gateway if
 * the direct API key is missing but AI_GATEWAY_API_KEY is set.
 */
export function getProvider(providerName: string): ProviderFactory {
	if (!providers[providerName]) {
		throw new Error(`Unknown provider: "${providerName}"`);
	}

	let provider = cache.get(providerName);
	if (!provider) {
		provider = providers[providerName]();
		cache.set(providerName, provider);
	}

	return provider;
}

/**
 * Resolve the provider + modelId for a given ModelConfig.
 * Handles gateway fallback: if the direct provider key is missing but
 * AI_GATEWAY_API_KEY is set, transparently route through the gateway.
 */
export function resolveProvider(model: ModelConfig): {
	provider: ProviderFactory;
	modelId: string;
} {
	// Gateway models always use the gateway provider directly
	if (model.provider === 'gateway') {
		return { provider: getProvider('gateway'), modelId: model.modelId };
	}

	// Ollama — always direct, never gateway
	if (model.provider === 'ollama') {
		return { provider: getProvider('ollama'), modelId: model.modelId };
	}

	// Try direct provider first
	try {
		return { provider: getProvider(model.provider), modelId: model.modelId };
	} catch {
		// Direct key missing — try gateway fallback
		if (isGatewayAvailable()) {
			return {
				provider: getProvider('gateway'),
				modelId: getGatewayModelId(model),
			};
		}
		// Re-throw the original error with gateway hint
		throw new Error(
			`${model.provider.toUpperCase()} API key not set. Either set the provider key or set AI_GATEWAY_API_KEY for unified access. See: aidiff models`,
		);
	}
}

/**
 * Check which providers have valid API keys configured.
 */
export function getAvailableProviders(): string[] {
	const available: string[] = [];
	for (const [name, factory] of Object.entries(providers)) {
		try {
			factory();
			available.push(name);
		} catch {
			// Key not set — skip
		}
	}
	if (!available.includes('ollama')) available.push('ollama');
	return available;
}
