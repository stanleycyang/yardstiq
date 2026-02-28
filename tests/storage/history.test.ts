import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComparisonResult } from '../../src/core/types.js';

vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
	mkdirSync: vi.fn(),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	readdirSync: vi.fn(),
}));

vi.mock('node:os', () => ({
	homedir: vi.fn(() => '/mock/home'),
}));

function makeResult(id = 'test-id', prompt = 'Hello'): ComparisonResult {
	return {
		id,
		prompt,
		responses: [],
		createdAt: '2025-01-01T00:00:00.000Z',
		totalCost: 0.006,
		totalTimeMs: 100,
	};
}

describe('storage/history', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('saveResult', () => {
		it('saves result to file with result ID', async () => {
			const { existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);

			const { saveResult } = await import('../../src/storage/history.js');
			const result = makeResult('MY-ULID');
			saveResult(result);

			expect(writeFileSync).toHaveBeenCalledWith(
				'/mock/home/.yardstiq/history/MY-ULID.json',
				JSON.stringify(result, null, 2),
			);
		});

		it('saves result with custom name', async () => {
			const { existsSync, writeFileSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);

			const { saveResult } = await import('../../src/storage/history.js');
			const result = makeResult('some-id');
			saveResult(result, 'my-comparison');

			expect(writeFileSync).toHaveBeenCalledWith(
				'/mock/home/.yardstiq/history/my-comparison.json',
				JSON.stringify(result, null, 2),
			);
		});

		it('creates history directory if it does not exist', async () => {
			const { existsSync, mkdirSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(false);

			const { saveResult } = await import('../../src/storage/history.js');
			saveResult(makeResult());

			expect(mkdirSync).toHaveBeenCalledWith('/mock/home/.yardstiq/history', {
				recursive: true,
			});
		});
	});

	describe('loadResult', () => {
		it('loads result by name', async () => {
			const { readFileSync } = await import('node:fs');
			const result = makeResult('test-id', 'Hello world');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify(result));

			const { loadResult } = await import('../../src/storage/history.js');
			const loaded = loadResult('my-test');

			expect(loaded).toBeDefined();
			expect(loaded?.id).toBe('test-id');
			expect(loaded?.prompt).toBe('Hello world');
			expect(readFileSync).toHaveBeenCalledWith(
				'/mock/home/.yardstiq/history/my-test.json',
				'utf-8',
			);
		});

		it('returns null for missing result', async () => {
			const { readFileSync } = await import('node:fs');
			vi.mocked(readFileSync).mockImplementation(() => {
				throw new Error('ENOENT');
			});

			const { loadResult } = await import('../../src/storage/history.js');
			expect(loadResult('nonexistent')).toBeNull();
		});
	});

	describe('listHistory', () => {
		it('lists all saved results', async () => {
			const { existsSync, readdirSync, readFileSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);
			vi.mocked(readdirSync).mockReturnValue(['first.json', 'second.json'] as any);

			const r1 = makeResult('id-1', 'First prompt');
			const r2 = makeResult('id-2', 'Second prompt');
			vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(r1));
			vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(r2));

			const { listHistory } = await import('../../src/storage/history.js');
			const items = listHistory();

			expect(items).toHaveLength(2);
			expect(items[0].name).toBe('first');
			expect(items[0].prompt).toBe('First prompt');
			expect(items[1].name).toBe('second');
			expect(items[1].prompt).toBe('Second prompt');
		});

		it('returns empty array when no history', async () => {
			const { existsSync, readdirSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);
			vi.mocked(readdirSync).mockReturnValue([] as any);

			const { listHistory } = await import('../../src/storage/history.js');
			expect(listHistory()).toEqual([]);
		});

		it('returns empty array on read error', async () => {
			const { existsSync, readdirSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(false);
			vi.mocked(readdirSync).mockImplementation(() => {
				throw new Error('ENOENT');
			});

			const { listHistory } = await import('../../src/storage/history.js');
			expect(listHistory()).toEqual([]);
		});

		it('filters non-json files', async () => {
			const { existsSync, readdirSync, readFileSync } = await import('node:fs');
			vi.mocked(existsSync).mockReturnValue(true);
			vi.mocked(readdirSync).mockReturnValue(['result.json', 'readme.txt', '.gitkeep'] as any);

			const r = makeResult('id-1', 'Test');
			vi.mocked(readFileSync).mockReturnValue(JSON.stringify(r));

			const { listHistory } = await import('../../src/storage/history.js');
			const items = listHistory();
			expect(items).toHaveLength(1);
			expect(items[0].name).toBe('result');
		});
	});
});
