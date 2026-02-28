import { formatCost } from '../core/cost.js';
import type { ComparisonResult } from '../core/types.js';

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function formatHTML(result: ComparisonResult): string {
	const modelCards = result.responses
		.map(
			(r) => `
      <div class="model-card">
        <h3>${escapeHtml(r.model.name)}</h3>
        <div class="status ${r.status}">${r.status}</div>
        <pre class="output">${r.status === 'success' ? escapeHtml(r.output) : escapeHtml(r.error || r.status)}</pre>
        <div class="stats">
          <span>Time: ${(r.timing.totalMs / 1000).toFixed(2)}s</span>
          <span>Tokens: ${r.usage.inputTokens}→${r.usage.outputTokens}</span>
          <span>Cost: ${formatCost(r.cost.totalCost)}</span>
        </div>
      </div>`,
		)
		.join('\n');

	const judgeSection = result.judge
		? `
    <div class="judge">
      <h2>Judge Verdict</h2>
      <p><strong>Winner:</strong> ${escapeHtml(result.judge.winner)}</p>
      <p>${escapeHtml(result.judge.reasoning)}</p>
      ${result.judge.scores
				.map(
					(s) => `<div class="score"><strong>${escapeHtml(s.model)}</strong>: ${s.score}/10</div>`,
				)
				.join('\n')}
    </div>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>yardstiq — Model Comparison</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1 { color: #58a6ff; margin-bottom: 0.5rem; }
  .prompt { background: #161b22; padding: 1rem; border-radius: 6px; margin: 1rem 0; border: 1px solid #30363d; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .model-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; }
  .model-card h3 { color: #58a6ff; margin-bottom: 0.5rem; }
  .output { white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; max-height: 600px; overflow-y: auto; padding: 1rem; background: #0d1117; border-radius: 4px; }
  .stats { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: #8b949e; }
  .status { font-size: 0.8rem; margin-bottom: 0.5rem; }
  .status.success { color: #3fb950; }
  .status.error { color: #f85149; }
  .status.timeout { color: #d29922; }
  .judge { background: #161b22; border: 2px solid #d29922; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
  .judge h2 { color: #d29922; margin-bottom: 0.5rem; }
  .score { margin: 0.25rem 0; }
  .summary { color: #8b949e; margin-top: 1rem; }
</style>
</head>
<body>
  <h1>yardstiq</h1>
  <div class="prompt"><strong>Prompt:</strong> ${escapeHtml(result.prompt)}</div>
  <div class="grid">${modelCards}</div>
  ${judgeSection}
  <div class="summary">
    Total cost: ${formatCost(result.totalCost)} | Time: ${(result.totalTimeMs / 1000).toFixed(2)}s | ${result.createdAt}
  </div>
</body>
</html>`;
}
