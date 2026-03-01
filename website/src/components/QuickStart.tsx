const steps = [
  {
    step: "1",
    title: "Install (or just use npx)",
    code: "npm install -g yardstiq",
    alt: "# or skip install entirely\nnpx yardstiq \"your prompt\" -m claude-sonnet -m gpt-4o",
  },
  {
    step: "2",
    title: "Configure your API keys",
    code: "# Interactive setup — walks you through it\nyardstiq setup\n\n# Or configure a single provider directly\nyardstiq setup --provider gateway",
    alt: "# Prefer env vars? That works too\nexport AI_GATEWAY_API_KEY=your_key\nexport ANTHROPIC_API_KEY=sk-ant-...",
  },
  {
    step: "3",
    title: "Compare models",
    code: '# Basic comparison\nyardstiq "Explain monads" -m claude-sonnet -m gpt-4o\n\n# With AI judge\nyardstiq "Write a sort algorithm" -m claude-sonnet -m gpt-4o --judge\n\n# Three models + export\nyardstiq "Explain DNS" -m claude-sonnet -m gpt-4o -m gemini-flash --json > results.json',
    alt: null,
  },
  {
    step: "4",
    title: "Go local (optional)",
    code: '# No API key needed — just run Ollama\nyardstiq "hello" -m local:llama3.2 -m local:mistral',
    alt: null,
  },
];

export function QuickStart() {
  return (
    <section id="quickstart" className="py-24 px-6 bg-zinc-900/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Up and running in{" "}
          <span className="text-green-terminal glow-green">60 seconds</span>
        </h2>
        <p className="text-zinc-400 text-center mb-16">
          No config files. No web UI. Just your terminal.
        </p>
        <div className="space-y-8">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-green-terminal/30 bg-green-terminal/10 flex items-center justify-center font-mono text-green-terminal font-bold">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-3">{s.title}</h3>
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
                  {s.code}
                </pre>
                {s.alt && (
                  <pre className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-400 overflow-x-auto">
                    {s.alt}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
