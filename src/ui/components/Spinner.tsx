import { Text } from 'ink';
import { useEffect, useState } from 'react';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface Props {
	label?: string;
}

export function Spinner({ label }: Props) {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((prev) => (prev + 1) % FRAMES.length);
		}, 80);
		return () => clearInterval(timer);
	}, []);

	return (
		<Text color="cyan">
			{' '}
			{FRAMES[frame]}
			{label ? ` ${label}` : ''}
		</Text>
	);
}
