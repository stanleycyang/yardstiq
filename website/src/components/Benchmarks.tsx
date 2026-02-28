const benchmarkData = [
  { model: "Claude Sonnet", coding: 92, creative: 88, reasoning: 94, speed: "69 t/s", cost: "$0.0013" },
  { model: "GPT-4o", coding: 89, creative: 85, reasoning: 90, speed: "48 t/s", cost: "$0.0010" },
  { model: "Gemini Flash", coding: 84, creative: 82, reasoning: 86, speed: "112 t/s", cost: "$0.0004" },
  { model: "Llama 3.1 70B", coding: 81, creative: 79, reasoning: 83, speed: "35 t/s", cost: "$0.0000" },
];

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-green-terminal" : score >= 85 ? "bg-cyan-terminal" : score >= 80 ? "bg-amber-terminal" : "bg-zinc-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-zinc-400 font-mono w-6">{score}</span>
    </div>
  );
}

export function Benchmarks() {
  return (
    <section id="benchmarks" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Real <span className="text-green-terminal glow-green">benchmarks</span>, not marketing
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          Run your own benchmark suites with YAML configs. Here&apos;s a sample across coding, creative writing, and reasoning tasks.
        </p>

        {/* YAML example */}
        <div className="mb-12 max-w-2xl mx-auto">
          <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 font-mono text-sm text-zinc-300 overflow-x-auto">
{`# benchmark.yaml
name: model-showdown
prompts:
  - "Write a Python fibonacci with memoization"
  - "Explain quantum entanglement to a 10-year-old"
  - "Debug this async race condition: ..."
models:
  - claude-sonnet
  - gpt-4o
  - gemini-flash
judge: true`}
          </pre>
          <p className="mt-3 text-center font-mono text-xs text-zinc-500">
            yardstiq benchmark run benchmark.yaml --json
          </p>
        </div>

        {/* Results table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Model</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Coding</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Creative</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Reasoning</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Speed</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">Cost/req</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkData.map((row) => (
                  <tr key={row.model} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                    <td className="py-4 px-6 font-medium font-mono text-sm">{row.model}</td>
                    <td className="py-4 px-4"><ScoreBar score={row.coding} /></td>
                    <td className="py-4 px-4"><ScoreBar score={row.creative} /></td>
                    <td className="py-4 px-4"><ScoreBar score={row.reasoning} /></td>
                    <td className="py-4 px-4 font-mono text-sm text-zinc-400">{row.speed}</td>
                    <td className="py-4 px-4 font-mono text-sm text-zinc-400">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
            Sample results — run your own benchmarks to get real numbers for your use case
          </div>
        </div>
      </div>
    </section>
  );
}
