export interface ModelConfig {
	/** Display name (e.g., "Claude Sonnet") */
	name: string;
	/** Full model ID (e.g., "claude-sonnet-4-20250514") */
	modelId: string;
	/** Provider name (e.g., "anthropic", "openai") */
	provider: string;
	/** Alias used in CLI (e.g., "claude-sonnet") */
	alias: string;
	/** Pricing per million tokens */
	pricing: {
		input: number; // $ per 1M input tokens
		output: number; // $ per 1M output tokens
	};
}

export interface ComparisonRequest {
	prompt: string;
	systemPrompt?: string;
	models: ModelConfig[];
	options: {
		temperature: number;
		maxTokens: number;
		stream: boolean;
		timeout: number;
	};
}

export interface ModelResponse {
	model: ModelConfig;
	output: string;
	timing: {
		startedAt: number; // timestamp ms
		firstTokenAt?: number; // timestamp ms (streaming only)
		completedAt: number; // timestamp ms
		totalMs: number;
		timeToFirstToken?: number; // ms
	};
	usage: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
	cost: {
		inputCost: number; // USD
		outputCost: number; // USD
		totalCost: number; // USD
	};
	status: 'success' | 'error' | 'timeout';
	error?: string;
}

export interface ComparisonResult {
	id: string; // ULID
	prompt: string;
	systemPrompt?: string;
	responses: ModelResponse[];
	judge?: JudgeVerdict;
	createdAt: string; // ISO timestamp
	totalCost: number;
	totalTimeMs: number;
}

export interface JudgeVerdict {
	winner: string; // model alias
	reasoning: string;
	scores: {
		model: string;
		score: number; // 1-10
		strengths: string[];
		weaknesses: string[];
	}[];
	judgeModel: string;
	judgeCost: number;
}

export interface BenchmarkSuite {
	name: string;
	description?: string;
	models: string[]; // model aliases
	judge?: {
		enabled: boolean;
		model?: string;
		criteria?: string;
	};
	prompts: BenchmarkPrompt[];
}

export interface BenchmarkPrompt {
	name: string;
	prompt: string;
	system?: string;
	criteria?: string; // specific judging criteria for this prompt
	expectedContains?: string[]; // output should contain these strings
	maxTokens?: number;
}

export interface BenchmarkReport {
	suite: string;
	results: ComparisonResult[];
	summary: {
		model: string;
		wins: number;
		avgScore: number;
		avgTimeMs: number;
		avgCost: number;
		totalCost: number;
	}[];
	totalCost: number;
	totalTimeMs: number;
}

export interface StreamCallbacks {
	onToken: (modelAlias: string, token: string) => void;
	onComplete: (modelAlias: string, response: ModelResponse) => void;
	onError: (modelAlias: string, error: Error) => void;
}
