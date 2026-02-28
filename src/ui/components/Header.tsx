import { Box, Text } from 'ink';
import type { ModelConfig } from '../../core/types.js';

interface Props {
	prompt: string;
	models: ModelConfig[];
}

export function Header({ prompt, models }: Props) {
	const truncatedPrompt = prompt.length > 120 ? `${prompt.slice(0, 117)}...` : prompt;

	return (
		<Box flexDirection="column">
			<Box>
				<Text bold color="cyan">
					aidiff
				</Text>
				<Text dimColor> — comparing {models.length} models</Text>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>Prompt: </Text>
				<Text>{truncatedPrompt}</Text>
			</Box>
			<Box>
				<Text dimColor>Models: </Text>
				<Text>{models.map((m) => m.name).join(' vs ')}</Text>
			</Box>
		</Box>
	);
}
