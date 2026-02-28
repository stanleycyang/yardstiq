"use client";

import { useEffect, useState } from "react";

const lines = [
  { text: "$ npx yardstiq \"Explain quicksort\" -m claude-sonnet -m gpt-4o", color: "text-green-terminal", delay: 0 },
  { text: "", color: "", delay: 800 },
  { text: " yardstiq — comparing 2 models", color: "text-cyan-terminal", delay: 1200 },
  { text: "", color: "", delay: 1400 },
  { text: " Prompt: Explain quicksort in 3 sentences", color: "text-zinc-400", delay: 1600 },
  { text: " Models: Claude Sonnet vs GPT-4o", color: "text-zinc-400", delay: 1800 },
  { text: "", color: "", delay: 2000 },
  { text: " ┌──────────────────────────────────┬──────────────────────────────────┐", color: "text-zinc-600", delay: 2200 },
  { text: " │ Claude Sonnet ✓                  │ GPT-4o ✓                         │", color: "text-purple-terminal", delay: 2400 },
  { text: " │                                  │                                  │", color: "text-zinc-600", delay: 2500 },
  { text: " │ Quicksort is a divide-and-       │ Quicksort works by selecting a   │", color: "text-zinc-300", delay: 2700 },
  { text: " │ conquer sorting algorithm that   │ \"pivot\" element and partitioning │", color: "text-zinc-300", delay: 2900 },
  { text: " │ works by selecting a \"pivot\"...  │ the array into two halves...     │", color: "text-zinc-300", delay: 3100 },
  { text: " └──────────────────────────────────┴──────────────────────────────────┘", color: "text-zinc-600", delay: 3300 },
  { text: "", color: "", delay: 3500 },
  { text: " ┌────────────────────────────────────────────────────────────────────────┐", color: "text-zinc-600", delay: 3700 },
  { text: " │ Performance                                                           │", color: "text-amber-terminal", delay: 3900 },
  { text: " │                                                                       │", color: "text-zinc-600", delay: 4000 },
  { text: " │ Model              Time     TTFT     Tokens     Tok/sec   Cost        │", color: "text-zinc-500", delay: 4100 },
  { text: " │ Claude Sonnet ⚡   1.24s    432ms    18→86      69.4 t/s  $0.0013     │", color: "text-green-terminal", delay: 4300 },
  { text: " │ GPT-4o             1.89s    612ms    18→91      48.1 t/s  $0.0010     │", color: "text-zinc-300", delay: 4500 },
  { text: " │                                                                       │", color: "text-zinc-600", delay: 4600 },
  { text: " │ Total cost: $0.0023                                                   │", color: "text-zinc-400", delay: 4700 },
  { text: " └────────────────────────────────────────────────────────────────────────┘", color: "text-zinc-600", delay: 4900 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 glow-border overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
        </div>
        {/* Content */}
        <div className="p-6 font-mono text-sm leading-6 text-left overflow-x-auto">
          {lines.slice(0, visibleLines).map((line, i) => (
            <div key={i} className={`${line.color} whitespace-pre`}>
              {line.text || "\u00A0"}
            </div>
          ))}
          {visibleLines < lines.length && (
            <span className="inline-block w-2 h-4 bg-green-terminal cursor-blink" />
          )}
        </div>
      </div>
    </div>
  );
}
