import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
	existsSync: vi.fn(() => true),
	mkdirSync: vi.fn(),
	readFileSync: vi.fn(() => '{}'),
	writeFileSync: vi.fn(),
}));

vi.mock('node:os', () => ({
	homedir: vi.fn(() => '/mock/home'),
}));

vi.mock('@inquirer/prompts', () => ({
	checkbox: vi.fn(),
	password: vi.fn(),
	confirm: vi.fn(),
}));

const ENV_VARS = [
	'AI_GATEWAY_API_KEY',
	'ANTHROPIC_API_KEY',
	'OPENAI_API_KEY',
	'GOOGLE_GENERATIVE_AI_API_KEY',
];

describe('cli/commands/setup', () => {
	let originalIsTTY: boolean | undefined;
	const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
		throw new Error('process.exit');
	});
	const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'log').mockImplementation(() => {});

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		originalIsTTY = process.stdin.isTTY;
		process.stdin.isTTY = true;
		for (const v of ENV_VARS) {
			delete process.env[v];
		}
	});

	afterEach(() => {
		process.stdin.isTTY = originalIsTTY;
		for (const v of ENV_VARS) {
			delete process.env[v];
		}
	});

	it('exits with error in non-TTY environment', async () => {
		process.stdin.isTTY = false;

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await expect(handleSetup({})).rejects.toThrow('process.exit');

		expect(mockConsoleError).toHaveBeenCalledWith(
			expect.stringContaining('requires an interactive terminal'),
		);
		expect(mockExit).toHaveBeenCalledWith(1);
	});

	it('exits with error for invalid --provider', async () => {
		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await expect(handleSetup({ provider: 'invalid' })).rejects.toThrow('process.exit');

		expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Unknown provider'));
		expect(mockExit).toHaveBeenCalledWith(1);
	});

	it('configures single provider with --provider flag', async () => {
		const { password } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(password).mockResolvedValue('my-anthropic-key');

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({ provider: 'anthropic' });

		expect(password).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Anthropic API key:' }),
		);
		expect(writeFileSync).toHaveBeenCalled();
		const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
		expect(written.keys.anthropic).toBe('my-anthropic-key');
		expect(process.env.ANTHROPIC_API_KEY).toBe('my-anthropic-key');
	});

	it('saves all selected keys from multi-select', async () => {
		const { checkbox, password } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(checkbox).mockResolvedValue(['gateway', 'openai']);
		vi.mocked(password).mockResolvedValueOnce('gw-key-123').mockResolvedValueOnce('oai-key-456');

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({});

		expect(writeFileSync).toHaveBeenCalled();
		const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
		expect(written.keys.gateway).toBe('gw-key-123');
		expect(written.keys.openai).toBe('oai-key-456');
		expect(process.env.AI_GATEWAY_API_KEY).toBe('gw-key-123');
		expect(process.env.OPENAI_API_KEY).toBe('oai-key-456');
	});

	it('skips empty input and does not save', async () => {
		const { checkbox, password } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(checkbox).mockResolvedValue(['anthropic']);
		vi.mocked(password).mockResolvedValue('');

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({});

		expect(writeFileSync).not.toHaveBeenCalled();
	});

	it('asks confirmation for already-configured keys', async () => {
		const { readFileSync } = await import('node:fs');
		vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { gateway: 'old-key' } }));

		const { checkbox, password, confirm } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(checkbox).mockResolvedValue(['gateway']);
		vi.mocked(confirm).mockResolvedValue(true);
		vi.mocked(password).mockResolvedValue('new-key');

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({});

		expect(confirm).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining('already configured'),
			}),
		);
		const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
		expect(written.keys.gateway).toBe('new-key');
	});

	it('skips key when user declines to replace and does not save', async () => {
		const { readFileSync } = await import('node:fs');
		vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { gateway: 'old-key' } }));

		const { checkbox, confirm } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(checkbox).mockResolvedValue(['gateway']);
		vi.mocked(confirm).mockResolvedValue(false);

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({});

		expect(writeFileSync).not.toHaveBeenCalled();
	});

	it('does nothing when no providers selected', async () => {
		const { checkbox } = await import('@inquirer/prompts');
		const { writeFileSync } = await import('node:fs');
		vi.mocked(checkbox).mockResolvedValue([]);

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({});

		expect(writeFileSync).not.toHaveBeenCalled();
	});

	it('sets process.env for google key', async () => {
		const { password } = await import('@inquirer/prompts');
		vi.mocked(password).mockResolvedValue('google-key-789');

		const { handleSetup } = await import('../../../src/cli/commands/setup.js');
		await handleSetup({ provider: 'google' });

		expect(process.env.GOOGLE_GENERATIVE_AI_API_KEY).toBe('google-key-789');
	});
});
