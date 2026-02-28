import { Box, render } from 'ink';
import { useEffect, useState } from 'react';
import { judgeComparison } from '../core/judge.js';
import { runComparison } from '../core/runner.js';
import type { ComparisonRequest, ComparisonResult, JudgeVerdict } from '../core/types.js';
import { Header } from './components/Header.js';
import { Judge } from './components/Judge.js';
import { SideBySide } from './components/SideBySide.js';
import { Spinner } from './components/Spinner.js';
import { Stats } from './components/Stats.js';
import { Summary } from './components/Summary.js';

export interface AppProps {
	request: ComparisonRequest;
	showJudge: boolean;
	judgeModel?: string;
	judgeCriteria?: string;
}

export function App({ request, showJudge, judgeModel, judgeCriteria }: AppProps) {
	const [streams, setStreams] = useState<Record<string, string>>({});
	const [result, setResult] = useState<ComparisonResult | null>(null);
	const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
	const [judging, setJudging] = useState(false);
	const [completedModels, setCompletedModels] = useState<Set<string>>(new Set());

	useEffect(() => {
		const initial: Record<string, string> = {};
		for (const m of request.models) {
			initial[m.alias] = '';
		}
		setStreams(initial);

		runComparison(request, {
			onToken: (alias, token) => {
				setStreams((prev) => ({ ...prev, [alias]: (prev[alias] || '') + token }));
			},
			onComplete: (alias) => {
				setCompletedModels((prev) => new Set([...prev, alias]));
			},
			onError: (alias, error) => {
				setStreams((prev) => ({ ...prev, [alias]: `ERROR: ${error.message}` }));
				setCompletedModels((prev) => new Set([...prev, alias]));
			},
		}).then(async (comparisonResult) => {
			setResult(comparisonResult);

			if (showJudge) {
				setJudging(true);
				try {
					const judgeVerdict = await judgeComparison(comparisonResult, {
						judgeModel,
						criteria: judgeCriteria,
					});
					setVerdict(judgeVerdict);
				} catch {
					// Judge failed — show comparison without verdict
				}
				setJudging(false);
			}
		});
	}, [judgeCriteria, judgeModel, request, showJudge]);

	const allComplete = completedModels.size === request.models.length;

	return (
		<Box flexDirection="column" padding={1}>
			<Header prompt={request.prompt} models={request.models} />

			<SideBySide models={request.models} streams={streams} completedModels={completedModels} />

			{allComplete && result && (
				<>
					<Stats responses={result.responses} />

					{judging && (
						<Box marginTop={1}>
							<Spinner label="Judge is evaluating responses..." />
						</Box>
					)}

					{verdict && <Judge verdict={verdict} />}

					<Summary result={result} verdict={verdict} />
				</>
			)}
		</Box>
	);
}

export function renderApp(props: AppProps) {
	render(<App {...props} />);
}
