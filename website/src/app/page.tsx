import { TerminalDemo } from "@/components/TerminalDemo";
import { Features } from "@/components/Features";
import { QuickStart } from "@/components/QuickStart";
import { Benchmarks } from "@/components/Benchmarks";
import { Footer } from "@/components/Footer";
import { GitHubStars } from "@/components/GitHubStars";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-green-terminal glow-green text-lg">
            yardstiq
          </span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-100 transition">
              Features
            </a>
            <a href="#quickstart" className="text-sm text-zinc-400 hover:text-zinc-100 transition">
              Install
            </a>
            <a href="#benchmarks" className="text-sm text-zinc-400 hover:text-zinc-100 transition">
              Benchmarks
            </a>
            <GitHubStars />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-xs text-zinc-400 font-mono">
            v1.0 — open source &amp; free
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Compare AI models{" "}
            <span className="text-green-terminal glow-green">side-by-side</span>
            <br />
            in your terminal
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            One prompt, multiple models, real-time streaming, performance stats, and an AI judge — all in a single command.
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <code className="bg-zinc-900 border border-zinc-700 rounded-lg px-5 py-3 font-mono text-green-terminal glow-border">
              npx yardstiq &quot;your prompt&quot; -m claude-sonnet -m gpt-4o
            </code>
          </div>
          <TerminalDemo />
        </div>
      </section>

      {/* Features */}
      <Features />

      {/* Quick Start */}
      <QuickStart />

      {/* Benchmarks */}
      <Benchmarks />

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Stop guessing.{" "}
            <span className="text-green-terminal glow-green">Start measuring.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join developers who use yardstiq to make data-driven model decisions.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://github.com/stanleycyang/yardstiq"
              className="inline-flex items-center gap-2 bg-green-terminal text-zinc-950 font-semibold px-6 py-3 rounded-lg hover:bg-green-300 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/yardstiq"
              className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 px-6 py-3 rounded-lg hover:border-zinc-500 hover:text-white transition"
            >
              View on npm
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
