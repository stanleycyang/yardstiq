import { Box, Text } from 'ink';
import { formatCost } from '../../core/cost.js';
import type { ComparisonResult, JudgeVerdict } from '../../core/types.js';

interface Props {
	result: ComparisonResult;
	verdict: JudgeVerdict | null;
}

export function Summary({ result, verdict }: Props) {
	const totalCost = verdict ? result.totalCost + verdict.judgeCost : result.totalCost;

	return (
		<Box flexDirection="column" marginTop={1}>
			<Box>
				<Text dimColor>
					Completed in {(result.totalTimeMs / 1000).toFixed(2)}s | Total cost:{' '}
					{formatCost(totalCost)}
				</Text>
			</Box>
			{verdict && (
				<Box>
					<Text dimColor>
						Winner:{' '}
						<Text bold color="green">
							{verdict.winner}
						</Text>
					</Text>
				</Box>
			)}
		</Box>
	);
}
