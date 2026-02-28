import { createAnthropic } from '@ai-sdk/anthropic';
import { createGateway } from '@ai-sdk/gateway';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';
import type { ModelConfig } from '../core/types.js';

// biome-ignore lint/suspicious/noExplicitAny: Provider return types vary across SDK packages
type ProviderFactory = (modelId: string) => any;

/** Map of gateway provider prefix → env var name for direct API keys */
const PROVIDER_KEY_MAP: Record<string, string> = {
	anthropic: 'ANTHROPIC_API_KEY',
	openai: 'OPENAI_API_KEY',
	google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

/** Map of gateway provider prefix → SDK factory constructor */
const PROVIDER_FACTORY_MAP: Record<string, (apiKey: string) => ProviderFactory> = {
	anthropic: (apiKey) => createAnthropic({ apiKey }) as unknown as ProviderFactory,
	openai: (apiKey) => createOpenAI({ apiKey }) as unknown as ProviderFactory,
	google: (apiKey) => createGoogleGenerativeAI({ apiKey }) as unknown as ProviderFactory,
};

/**
 * Create the gateway provider instance.
 * Uses AI_GATEWAY_API_KEY env var by default.
 */
function createGatewayProvider(): ProviderFactory {
	// isGatewayAvailable() is always checked before calling this function,
	// so AI_GATEWAY_API_KEY is guaranteed to be set.
	const key = process.env.AI_GATEWAY_API_KEY as string;
	return createGateway({ apiKey: key }) as unknown as ProviderFactory;
}

/**
 * Create the Ollama provider for local models.
 */
function createOllamaProvider(): ProviderFactory {
	const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
	return createOllama({ baseURL: baseUrl }) as unknown as ProviderFactory;
}

// Cache initialized providers
let gatewayProvider: ProviderFactory | undefined;
let ollamaProvider: ProviderFactory | undefined;
const directProviders = new Map<string, ProviderFactory>();

function getGateway(): ProviderFactory {
	if (!gatewayProvider) {
		gatewayProvider = createGatewayProvider();
	}
	return gatewayProvider;
}

function getOllama(): ProviderFactory {
	if (!ollamaProvider) {
		ollamaProvider = createOllamaProvider();
	}
	return ollamaProvider;
}

function getDirectProvider(providerPrefix: string): ProviderFactory | undefined {
	if (directProviders.has(providerPrefix)) {
		return directProviders.get(providerPrefix);
	}

	const envVar = PROVIDER_KEY_MAP[providerPrefix];
	if (!envVar) return undefined;

	const apiKey = process.env[envVar];
	if (!apiKey) return undefined;

	const factory = PROVIDER_FACTORY_MAP[providerPrefix];
	// PROVIDER_KEY_MAP and PROVIDER_FACTORY_MAP share the same keys,
	// so factory is guaranteed to exist if envVar was found above.
	const provider = (factory as (key: string) => ProviderFactory)(apiKey);
	directProviders.set(providerPrefix, provider);
	return provider;
}

/**
 * Check if the Vercel AI Gateway is configured.
 */
export function isGatewayAvailable(): boolean {
	return !!process.env.AI_GATEWAY_API_KEY;
}

/**
 * Check which providers have direct API keys configured.
 * Returns a map of provider prefix → boolean.
 */
export function getAvailableProviders(): Record<string, boolean> {
	const result: Record<string, boolean> = {};
	for (const [prefix, envVar] of Object.entries(PROVIDER_KEY_MAP)) {
		result[prefix] = !!process.env[envVar];
	}
	return result;
}

/**
 * Resolve the provider + modelId for a given ModelConfig.
 * Priority: direct provider key → AI Gateway → error.
 */
export function resolveProvider(model: ModelConfig): {
	provider: ProviderFactory;
	modelId: string;
} {
	// Ollama — always local, never gateway
	if (model.provider === 'ollama') {
		return { provider: getOllama(), modelId: model.modelId };
	}

	// Extract provider prefix from modelId (e.g., "anthropic" from "anthropic/claude-sonnet-4.6")
	const slashIdx = model.modelId.indexOf('/');
	const providerPrefix = slashIdx > 0 ? model.modelId.slice(0, slashIdx) : '';
	const bareModelId = slashIdx > 0 ? model.modelId.slice(slashIdx + 1) : model.modelId;

	// Try direct provider key first
	if (providerPrefix) {
		const directProvider = getDirectProvider(providerPrefix);
		if (directProvider) {
			return { provider: directProvider, modelId: bareModelId };
		}
	}

	// Fall back to gateway
	if (isGatewayAvailable()) {
		return { provider: getGateway(), modelId: model.modelId };
	}

	// No access available
	const envVar = providerPrefix ? PROVIDER_KEY_MAP[providerPrefix] : undefined;
	const keyHint = envVar ? `${envVar} or ` : '';
	throw new Error(
		`No API key for ${model.name}. Set ${keyHint}AI_GATEWAY_API_KEY to access this model.`,
	);
}

/**
 * Reset cached providers (for testing).
 */
export function resetProviderCache(): void {
	gatewayProvider = undefined;
	ollamaProvider = undefined;
	directProviders.clear();
}
