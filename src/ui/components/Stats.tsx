import { Box, Text } from 'ink';
import { formatCost } from '../../core/cost.js';
import type { ModelResponse } from '../../core/types.js';

interface Props {
	responses: ModelResponse[];
}

export function Stats({ responses }: Props) {
	const successResponses = responses.filter((r) => r.status === 'success');
	const fastest =
		successResponses.length > 0
			? successResponses.reduce((min, r) => (r.timing.totalMs < min.timing.totalMs ? r : min))
			: null;

	return (
		<Box flexDirection="column" marginTop={1} borderStyle="single" paddingX={1}>
			<Text bold underline>
				Performance
			</Text>

			<Box flexDirection="row" marginTop={1}>
				<Box width={20}>
					<Text bold>Model</Text>
				</Box>
				<Box width={12}>
					<Text bold>Time</Text>
				</Box>
				<Box width={10}>
					<Text bold>TTFT</Text>
				</Box>
				<Box width={14}>
					<Text bold>Tokens</Text>
				</Box>
				<Box width={12}>
					<Text bold>Tok/sec</Text>
				</Box>
				<Box width={10}>
					<Text bold>Cost</Text>
				</Box>
			</Box>

			{responses.map((r) => {
				const tokPerSec =
					r.timing.totalMs > 0
						? ((r.usage.outputTokens / r.timing.totalMs) * 1000).toFixed(1)
						: '-';
				const isFastest = fastest !== null && r.model.alias === fastest.model.alias;

				return (
					<Box flexDirection="row" key={r.model.alias}>
						<Box width={20}>
							<Text color={isFastest ? 'green' : undefined}>
								{r.model.name}
								{isFastest ? ' ⚡' : ''}
							</Text>
						</Box>
						<Box width={12}>
							<Text>
								{r.status === 'success' ? `${(r.timing.totalMs / 1000).toFixed(2)}s` : r.status}
							</Text>
						</Box>
						<Box width={10}>
							<Text>{r.timing.timeToFirstToken ? `${r.timing.timeToFirstToken}ms` : '-'}</Text>
						</Box>
						<Box width={14}>
							<Text>
								{r.usage.inputTokens}→{r.usage.outputTokens}
							</Text>
						</Box>
						<Box width={12}>
							<Text>{tokPerSec} t/s</Text>
						</Box>
						<Box width={10}>
							<Text color="yellow">{formatCost(r.cost.totalCost)}</Text>
						</Box>
					</Box>
				);
			})}

			<Box marginTop={1}>
				<Text dimColor>
					Total cost: {formatCost(responses.reduce((s, r) => s + r.cost.totalCost, 0))}
				</Text>
			</Box>
		</Box>
	);
}
