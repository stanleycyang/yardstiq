import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
	mkdirSync: vi.fn(),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
}));

vi.mock('node:os', () => ({
	homedir: vi.fn(() => '/mock/home'),
}));

describe('storage/config', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	describe('getConfig', () => {
		it('reads config from file', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { gateway: 'test-key' } }));

			const { getConfig } = await import('../../src/storage/config.js');
			const config = getConfig();
			expect(config.keys?.gateway).toBe('test-key');
			expect(readFileSync).toHaveBeenCalledWith('/mock/home/.yardstiq/config.json', 'utf-8');
		});

		it('returns empty config when file is missing', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockImplementation(() => {
				throw new Error('ENOENT');
			});

			const { getConfig } = await import('../../src/storage/config.js');
			const config = getConfig();
			expect(config).toEqual({});
		});
	});

	describe('saveConfig', () => {
		it('writes config to file', async () => {
			const { existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);

			const { saveConfig } = await import('../../src/storage/config.js');
			saveConfig({ keys: { gateway: 'new-key' } });

			expect(writeFileSync).toHaveBeenCalledWith(
				'/mock/home/.yardstiq/config.json',
				JSON.stringify({ keys: { gateway: 'new-key' } }, null, 2),
			);
		});

		it('creates config directory if it does not exist', async () => {
			const { existsSync, mkdirSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(false);

			const { saveConfig } = await import('../../src/storage/config.js');
			saveConfig({});

			expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.yardstiq', { recursive: true });
		});
	});

	describe('setConfigValue', () => {
		it('sets gateway-key', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('gateway-key', 'gw-test');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.gateway).toBe('gw-test');
		});

		it('sets anthropic-key', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('anthropic-key', 'sk-ant-test');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.anthropic).toBe('sk-ant-test');
		});

		it('sets openai-key', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('openai-key', 'sk-test');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.openai).toBe('sk-test');
		});

		it('sets google-key', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('google-key', 'google-test');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.google).toBe('google-test');
		});

		it('sets temperature', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('temperature', '0.7');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.defaults.temperature).toBe(0.7);
		});

		it('sets max-tokens', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('max-tokens', '4096');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.defaults.maxTokens).toBe(4096);
		});

		it('sets judge-model', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('judge-model', 'gpt-4o');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.defaults.judgeModel).toBe('gpt-4o');
		});

		it('sets key when config already has keys object', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { gateway: 'existing' } }));
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('anthropic-key', 'sk-ant-new');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.gateway).toBe('existing');
			expect(written.keys.anthropic).toBe('sk-ant-new');
		});

		it('handles unknown config key gracefully', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('unknown-key', 'whatever');

			// Should still call saveConfig (with defaults object but no recognized key set)
			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.defaults).toBeDefined();
			expect(written.defaults.temperature).toBeUndefined();
		});

		it('preserves existing config values', async () => {
			const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(
				JSON.stringify({ keys: { gateway: 'existing' }, defaults: { temperature: 0.5 } }),
			);
			vi.mocked(existsSync).mockReturnValue(true);

			const { setConfigValue } = await import('../../src/storage/config.js');
			setConfigValue('max-tokens', '2048');

			const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
			expect(written.keys.gateway).toBe('existing');
			expect(written.defaults.temperature).toBe(0.5);
			expect(written.defaults.maxTokens).toBe(2048);
		});
	});

	describe('getConfigValue', () => {
		it('gets gateway-key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { gateway: 'gw-val' } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('gateway-key')).toBe('gw-val');
		});

		it('gets anthropic-key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { anthropic: 'ant-val' } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('anthropic-key')).toBe('ant-val');
		});

		it('gets openai-key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { openai: 'oai-val' } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('openai-key')).toBe('oai-val');
		});

		it('gets google-key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ keys: { google: 'goog-val' } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('google-key')).toBe('goog-val');
		});

		it('gets temperature', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ defaults: { temperature: 0.8 } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('temperature')).toBe('0.8');
		});

		it('gets max-tokens', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ defaults: { maxTokens: 4096 } }));

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('max-tokens')).toBe('4096');
		});

		it('gets judge-model', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue(
				JSON.stringify({ defaults: { judgeModel: 'gpt-4o' } }),
			);

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('judge-model')).toBe('gpt-4o');
		});

		it('returns undefined for unknown key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('unknown-key')).toBeUndefined();
		});

		it('returns undefined for unset key', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockReturnValue('{}');

			const { getConfigValue } = await import('../../src/storage/config.js');
			expect(getConfigValue('gateway-key')).toBeUndefined();
		});
	});
});
