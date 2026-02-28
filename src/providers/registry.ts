import { createGateway } from '@ai-sdk/gateway';
import { createOllama } from 'ollama-ai-provider';
import type { ModelConfig } from '../core/types.js';

// biome-ignore lint/suspicious/noExplicitAny: Provider return types vary across SDK packages
type ProviderFactory = (modelId: string) => any;

/**
 * Create the gateway provider instance.
 * Uses AI_GATEWAY_API_KEY env var by default.
 */
function createGatewayProvider(): ProviderFactory {
	const key = process.env.AI_GATEWAY_API_KEY;
	if (!key) {
		throw new Error(
			'AI_GATEWAY_API_KEY not set. Get one at https://vercel.com/ai-gateway',
		);
	}
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

/**
 * Check if the Vercel AI Gateway is configured.
 */
export function isGatewayAvailable(): boolean {
	return !!process.env.AI_GATEWAY_API_KEY;
}

/**
 * Resolve the provider + modelId for a given ModelConfig.
 * All non-local models route through the Vercel AI Gateway.
 */
export function resolveProvider(model: ModelConfig): {
	provider: ProviderFactory;
	modelId: string;
} {
	// Ollama — always local, never gateway
	if (model.provider === 'ollama') {
		return { provider: getOllama(), modelId: model.modelId };
	}

	// Everything else goes through the gateway
	return { provider: getGateway(), modelId: model.modelId };
}
