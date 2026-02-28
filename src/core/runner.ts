import { generateText, streamText } from 'ai';
import { ulid } from 'ulid';
import { resolveProvider } from '../providers/registry.js';
import { calculateCost } from './cost.js';
import type {
	ComparisonRequest,
	ComparisonResult,
	ModelConfig,
	ModelResponse,
	StreamCallbacks,
} from './types.js';

export async function runComparison(
	request: ComparisonRequest,
	callbacks?: StreamCallbacks,
): Promise<ComparisonResult> {
	const startTime = Date.now();

	const responsePromises = request.models.map((model) => runSingleModel(model, request, callbacks));

	const responses = await Promise.all(responsePromises);

	return {
		id: ulid(),
		prompt: request.prompt,
		systemPrompt: request.systemPrompt,
		responses,
		createdAt: new Date().toISOString(),
		totalCost: responses.reduce((sum, r) => sum + r.cost.totalCost, 0),
		totalTimeMs: Date.now() - startTime,
	};
}

async function runSingleModel(
	model: ModelConfig,
	request: ComparisonRequest,
	callbacks?: StreamCallbacks,
): Promise<ModelResponse> {
	const { provider, modelId } = resolveProvider(model);
	const startedAt = Date.now();
	let firstTokenAt: number | undefined;

	try {
		if (request.options.stream && callbacks) {
			const result = streamText({
				model: provider(modelId),
				prompt: request.prompt,
				system: request.systemPrompt,
				temperature: request.options.temperature,
				maxOutputTokens: request.options.maxTokens,
				abortSignal: AbortSignal.timeout(request.options.timeout * 1000),
			});

			let fullText = '';
			for await (const chunk of result.textStream) {
				if (!firstTokenAt) firstTokenAt = Date.now();
				fullText += chunk;
				callbacks.onToken(model.alias, chunk);
			}

			const usage = await result.usage;
			const completedAt = Date.now();
			const inTok = usage.inputTokens ?? 0;
			const outTok = usage.outputTokens ?? 0;
			const cost = calculateCost(model, inTok, outTok);

			const response: ModelResponse = {
				model,
				output: fullText,
				timing: {
					startedAt,
					firstTokenAt,
					completedAt,
					totalMs: completedAt - startedAt,
					timeToFirstToken: firstTokenAt ? firstTokenAt - startedAt : undefined,
				},
				usage: {
					inputTokens: inTok,
					outputTokens: outTok,
					totalTokens: inTok + outTok,
				},
				cost,
				status: 'success',
			};

			callbacks.onComplete(model.alias, response);
			return response;
		}

		// Non-streaming mode
		const result = await generateText({
			model: provider(modelId),
			prompt: request.prompt,
			system: request.systemPrompt,
			temperature: request.options.temperature,
			maxOutputTokens: request.options.maxTokens,
			abortSignal: AbortSignal.timeout(request.options.timeout * 1000),
		});

		const completedAt = Date.now();
		const inTok = result.usage.inputTokens ?? 0;
		const outTok = result.usage.outputTokens ?? 0;
		const cost = calculateCost(model, inTok, outTok);

		return {
			model,
			output: result.text,
			timing: {
				startedAt,
				completedAt,
				totalMs: completedAt - startedAt,
			},
			usage: {
				inputTokens: inTok,
				outputTokens: outTok,
				totalTokens: inTok + outTok,
			},
			cost,
			status: 'success',
		};
	} catch (err) {
		const error = err as Error & { name: string };
		const completedAt = Date.now();
		const response: ModelResponse = {
			model,
			output: '',
			timing: {
				startedAt,
				completedAt,
				totalMs: completedAt - startedAt,
			},
			usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
			cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
			status: error.name === 'AbortError' ? 'timeout' : 'error',
			error: error.message,
		};
		callbacks?.onError(model.alias, error);
		return response;
	}
}
