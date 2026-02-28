import type { ComparisonResult } from '../core/types.js';

export function formatJSON(result: ComparisonResult): string {
	return JSON.stringify(result, null, 2);
}
