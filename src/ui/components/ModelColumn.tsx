import { Box, Text } from 'ink';
import type { ModelConfig } from '../../core/types.js';
import { Spinner } from './Spinner.js';

const MODEL_COLORS = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red'] as const;

interface Props {
	model: ModelConfig;
	content: string;
	isComplete: boolean;
	width: number;
	colorIndex: number;
}

export function ModelColumn({ model, content, isComplete, width, colorIndex }: Props) {
	const color = MODEL_COLORS[colorIndex % MODEL_COLORS.length];

	return (
		<Box flexDirection="column" width={width} paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color={color}>
					{model.name}
				</Text>
				{!isComplete && <Spinner />}
				{isComplete && <Text color="green"> ✓</Text>}
			</Box>

			<Box flexDirection="column">
				<Text wrap="wrap">{content || (isComplete ? '(empty response)' : '')}</Text>
			</Box>
		</Box>
	);
}
