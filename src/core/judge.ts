import { generateText } from 'ai';
import { resolveProvider } from '../providers/registry.js';
import { calculateCost } from './cost.js';
import { resolveModel } from './models.js';
import type { ComparisonResult, JudgeVerdict } from './types.js';

const DEFAULT_JUDGE_MODEL = 'claude-sonnet';

const JUDGE_SYSTEM_PROMPT = `You are an expert AI output evaluator. You will be given a prompt and responses from multiple AI models. Your job is to evaluate each response objectively and pick a winner.

Evaluate on these criteria (unless the user specifies different criteria):
1. **Correctness**: Is the response factually accurate and logically sound?
2. **Completeness**: Does it fully address the prompt?
3. **Clarity**: Is it well-written, organized, and easy to understand?
4. **Conciseness**: Does it avoid unnecessary verbosity?
5. **Code Quality** (if applicable): Is the code correct, idiomatic, well-structured?

Be fair and objective. Do not favor any model brand. Focus only on output quality.

Respond in this exact JSON format:
{
  "winner": "<model_alias>",
  "reasoning": "<2-3 sentence explanation of why the winner was chosen>",
  "scores": [
    {
      "model": "<model_alias>",
      "score": <1-10>,
      "strengths": ["<strength1>", "<strength2>"],
      "weaknesses": ["<weakness1>"]
    }
  ]
}`;

export async function judgeComparison(
	result: ComparisonResult,
	options: {
		judgeModel?: string;
		criteria?: string;
	} = {},
): Promise<JudgeVerdict> {
	const judgeModelConfig = resolveModel(options.judgeModel || DEFAULT_JUDGE_MODEL);
	const { provider, modelId } = resolveProvider(judgeModelConfig);

	const responseSections = result.responses
		.filter((r) => r.status === 'success')
		.map((r) => `### Model: ${r.model.alias}\n\n${r.output}`)
		.join('\n\n---\n\n');

	const customCriteria = options.criteria
		? `\n\nUSER'S CUSTOM EVALUATION CRITERIA:\n${options.criteria}\n\nUse these criteria INSTEAD of the default criteria.`
		: '';

	const judgePrompt = `## Original Prompt\n\n${result.prompt}\n\n## Model Responses\n\n${responseSections}${customCriteria}\n\nEvaluate the responses and return your verdict as JSON.`;

	const judgeResult = await generateText({
		model: provider(modelId),
		system: JUDGE_SYSTEM_PROMPT,
		prompt: judgePrompt,
		temperature: 0,
		maxOutputTokens: 1024,
	});

	const jsonMatch = judgeResult.text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw new Error('Judge did not return valid JSON');
	}

	const verdict = JSON.parse(jsonMatch[0]) as JudgeVerdict;
	verdict.judgeModel = judgeModelConfig.alias;
	verdict.judgeCost = calculateCost(
		judgeModelConfig,
		judgeResult.usage.inputTokens ?? 0,
		judgeResult.usage.outputTokens ?? 0,
	).totalCost;

	return verdict;
}
