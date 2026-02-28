import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBenchmarkFile } from '../../src/bench/parser.js';

function writeTempYaml(content: string): string {
	const dir = mkdtempSync(join(tmpdir(), 'yardstiq-test-'));
	const path = join(dir, 'bench.yaml');
	writeFileSync(path, content, 'utf-8');
	return path;
}

describe('parseBenchmarkFile', () => {
	it('parses a valid benchmark file', () => {
		const suite = parseBenchmarkFile('tests/fixtures/test-benchmark.yaml');
		expect(suite.name).toBe('Test Benchmark');
		expect(suite.description).toBe('Minimal benchmark for testing');
		expect(suite.models).toEqual(['claude-sonnet', 'gpt-4o']);
		expect(suite.judge?.enabled).toBe(true);
		expect(suite.judge?.model).toBe('claude-sonnet');
		expect(suite.prompts).toHaveLength(2);
		expect(suite.prompts[0].name).toBe('Hello world');
		expect(suite.prompts[0].prompt).toBe('Say hello world');
		expect(suite.prompts[0].expectedContains).toEqual(['hello']);
		expect(suite.prompts[1].system).toBe('Be concise');
		expect(suite.prompts[1].maxTokens).toBe(256);
	});

	it('handles optional fields being absent', () => {
		const path = writeTempYaml(`
name: "Minimal"
models:
  - model-a
  - model-b
prompts:
  - name: "Test"
    prompt: "Hello"
`);
		const suite = parseBenchmarkFile(path);
		expect(suite.description).toBeUndefined();
		expect(suite.judge).toBeUndefined();
		expect(suite.prompts[0].system).toBeUndefined();
		expect(suite.prompts[0].criteria).toBeUndefined();
		expect(suite.prompts[0].expectedContains).toBeUndefined();
		expect(suite.prompts[0].maxTokens).toBeUndefined();
	});

	it('throws if name is missing', () => {
		const path = writeTempYaml(`
models:
  - a
  - b
prompts:
  - name: "Test"
    prompt: "Hello"
`);
		expect(() => parseBenchmarkFile(path)).toThrow('missing required field: "name"');
	});

	it('throws if models has fewer than 2 entries', () => {
		const path = writeTempYaml(`
name: "Bad"
models:
  - only-one
prompts:
  - name: "Test"
    prompt: "Hello"
`);
		expect(() => parseBenchmarkFile(path)).toThrow('at least 2 entries');
	});

	it('throws if models is missing', () => {
		const path = writeTempYaml(`
name: "Bad"
prompts:
  - name: "Test"
    prompt: "Hello"
`);
		expect(() => parseBenchmarkFile(path)).toThrow('at least 2 entries');
	});

	it('throws if prompts is empty', () => {
		const path = writeTempYaml(`
name: "Bad"
models:
  - a
  - b
prompts: []
`);
		expect(() => parseBenchmarkFile(path)).toThrow('at least 1 entry');
	});

	it('throws if prompt entry is missing name', () => {
		const path = writeTempYaml(`
name: "Bad"
models:
  - a
  - b
prompts:
  - prompt: "Hello"
`);
		expect(() => parseBenchmarkFile(path)).toThrow(
			'Prompt at index 0 missing required field: "name"',
		);
	});

	it('throws if prompt entry is missing prompt text', () => {
		const path = writeTempYaml(`
name: "Bad"
models:
  - a
  - b
prompts:
  - name: "Test"
`);
		expect(() => parseBenchmarkFile(path)).toThrow('missing required field: "prompt"');
	});

	it('throws for non-existent file', () => {
		expect(() => parseBenchmarkFile('/nonexistent/path.yaml')).toThrow();
	});
});
