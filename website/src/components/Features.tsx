const features = [
  {
    icon: "⚡",
    title: "Side-by-Side Streaming",
    description: "Watch model outputs appear in parallel, in real time. No more tab-switching between chat windows.",
  },
  {
    icon: "🤖",
    title: "40+ Models",
    description: "Claude, GPT, Gemini, Llama, DeepSeek, Mistral, Grok — every major model in one tool.",
  },
  {
    icon: "📊",
    title: "Performance Stats",
    description: "Time to first token, throughput, token counts, and cost per model. Data, not vibes.",
  },
  {
    icon: "⚖️",
    title: "AI Judge",
    description: "Let an AI evaluate which response wins with scored verdicts and reasoning.",
  },
  {
    icon: "📁",
    title: "Export Anywhere",
    description: "JSON for pipelines, Markdown for docs, self-contained HTML for sharing.",
  },
  {
    icon: "🧪",
    title: "Benchmark Suites",
    description: "Define prompt suites in YAML and run them across models with aggregate scoring.",
  },
  {
    icon: "🏠",
    title: "Local Models",
    description: "Compare Ollama models with zero API cost. Your hardware, your data, your rules.",
  },
  {
    icon: "🔑",
    title: "Flexible Auth",
    description: "One Vercel AI Gateway key for everything, or individual provider keys. Mix and match.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to{" "}
          <span className="text-green-terminal glow-green">compare models</span>
        </h2>
        <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
          Stop copying prompts between tabs. One command gives you streaming comparisons, hard numbers, and AI-powered evaluation.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition group"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold mb-2 group-hover:text-green-terminal transition">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
