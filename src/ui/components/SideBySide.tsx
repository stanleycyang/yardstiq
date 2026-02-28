import { Box } from 'ink';
import type { ModelConfig } from '../../core/types.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { ModelColumn } from './ModelColumn.js';

interface Props {
	models: ModelConfig[];
	streams: Record<string, string>;
	completedModels: Set<string>;
}

export function SideBySide({ models, streams, completedModels }: Props) {
	const { columns } = useTerminalSize();

	const numModels = models.length;
	const borderChars = numModels + 1;
	const padding = numModels * 2;
	const availableWidth = columns - borderChars - padding;
	const colWidth = Math.floor(availableWidth / numModels);

	return (
		<Box flexDirection="row" borderStyle="single" marginTop={1}>
			{models.map((model, i) => (
				<ModelColumn
					key={model.alias}
					model={model}
					content={streams[model.alias] || ''}
					isComplete={completedModels.has(model.alias)}
					width={colWidth}
					colorIndex={i}
				/>
			))}
		</Box>
	);
}
