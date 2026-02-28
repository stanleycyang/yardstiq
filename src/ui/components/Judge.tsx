import { Box, Text } from 'ink';
import { formatCost } from '../../core/cost.js';
import type { JudgeVerdict } from '../../core/types.js';

interface Props {
	verdict: JudgeVerdict;
}

export function Judge({ verdict }: Props) {
	return (
		<Box
			flexDirection="column"
			marginTop={1}
			borderStyle="double"
			paddingX={1}
			borderColor="yellow"
		>
			<Text bold color="yellow">
				Judge Verdict (by {verdict.judgeModel})
			</Text>

			<Box marginTop={1}>
				<Text>
					Winner:{' '}
					<Text bold color="green">
						{verdict.winner}
					</Text>
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text wrap="wrap">{verdict.reasoning}</Text>
			</Box>

			<Box flexDirection="column" marginTop={1}>
				{verdict.scores.map((s) => (
					<Box key={s.model} flexDirection="row" gap={2}>
						<Box width={20}>
							<Text bold>{s.model}</Text>
						</Box>
						<Box width={8}>
							<Text color={s.score >= 8 ? 'green' : s.score >= 5 ? 'yellow' : 'red'}>
								{s.score}/10
							</Text>
						</Box>
						<Text dimColor>
							+{s.strengths.join(', ')}
							{s.weaknesses.length > 0 ? ` | -${s.weaknesses.join(', ')}` : ''}
						</Text>
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				<Text dimColor>Judge cost: {formatCost(verdict.judgeCost)}</Text>
			</Box>
		</Box>
	);
}
