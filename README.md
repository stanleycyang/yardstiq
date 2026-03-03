[![CI](https://github.com/stanleycyang/yardstiq/actions/workflows/ci.yml/badge.svg)](https://github.com/stanleycyang/yardstiq/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/yardstiq)](https://www.npmjs.com/package/yardstiq)
[![npm downloads](https://img.shields.io/npm/dm/yardstiq)](https://www.npmjs.com/package/yardstiq)
[![Node.js](https://img.shields.io/node/v/yardstiq)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# yardstiq

> Compare AI models side-by-side in your terminal. One prompt, multiple models, real-time streaming, performance stats, and an AI judge — all in a single command.

![yardstiq demo](demo.gif)

```bash
npx yardstiq "Which AI model is best for coding?" -m claude-sonnet -m gpt-4o -m gemini-flash
```

```
 yardstiq — comparing 2 models

 Prompt: Explain quicksort in 3 sentences
 Models: Claude Sonnet vs GPT-4o

 ┌──────────────────────────────────┬──────────────────────────────────┐
 │ Claude Sonnet ✓                  │ GPT-4o ✓                         │
 │                                  │                                  │
 │ Quicksort is a divide-and-       │ Quicksort works by selecting a   │
 │ conquer sorting algorithm that   │ "pivot" element and partitioning │
 │ works by selecting a "pivot"...  │ the array into two halves...     │
 └──────────────────────────────────┴──────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────┐
 │ Performance                                                           │
 │                                                                       │
 │ Model              Time     TTFT     Tokens     Tok/sec   Cost        │
 │ Claude Sonnet ⚡   1.24s    432ms    18→86      69.4 t/s  $0.0013     │
 │ GPT-4o             1.89s    612ms    18→91      48.1 t/s  $0.0010     │
 │                                                                       │
 │ Total cost: $0.0023                                                   │
 └────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install globally
npm install -g yardstiq

# Run your first comparison (no install needed)
npx yardstiq "Explain recursion in simple terms" -m claude-sonnet -m gpt-4o

# Compare 3 models with the AI judge
npx yardstiq "Write a binary search function" -m claude-sonnet -m gpt-4o -m gemini-flash --judge
```

## Features

- **Side-by-side streaming** — Watch model outputs appear in parallel, in real time
- **40+ models** — Claude, GPT, Gemini, Llama, DeepSeek, Mistral, Grok, and more
- **Performance stats** — Time, TTFT, token counts, throughput, and cost per model
- **AI judge** — Let an AI evaluate which response is best with scored verdicts
- **Multiple export formats** — JSON, Markdown, and self-contained HTML reports
- **Benchmarks** — Run YAML-defined prompt suites across models with aggregate scoring
- **History** — Save and revisit past comparisons
- **Local models** — Compare against Ollama models with zero API cost
- **Flexible auth** — AI Gateway for one-key access, or individual provider keys

## Why yardstiq?

Choosing between AI models shouldn't require opening 3 browser tabs and copy-pasting the same prompt manually. yardstiq runs your prompt through every model **simultaneously**, streams the results side-by-side, and gives you real performance data — so you can make informed decisions about which model to use for your actual workload.

- 🚀 **Faster decisions** — stop guessing, start comparing
- 💰 **Cost visibility** — see what each call actually costs before you commit
- 🏆 **AI judge** — automated quality scoring with reasoning
- 🔒 **Privacy-first** — all comparisons run locally; nothing is stored externally

## Install

```bash
# npm
npm install -g yardstiq

# pnpm
pnpm add -g yardstiq

# npx (no install)
npx yardstiq "your prompt" -m claude-sonnet -m gpt-4o
```

### From source

```bash
git clone https://github.com/stanleycyang/yardstiq.git
cd yardstiq
pnpm install
pnpm build
node dist/index.js --help
```

## Setup

yardstiq needs API keys to call models. The fastest way to get started:

### Interactive setup (recommended)

```bash
yardstiq setup
```

This walks you through configuring API keys with a guided prompt. Keys are saved to `~/.yardstiq/config.json` and loaded automatically — no shell config needed.

You can also configure a single provider directly:

```bash
yardstiq setup --provider gateway
yardstiq setup --provider anthropic
yardstiq setup --provider openai
yardstiq setup --provider google
```

### AI Gateway (one key for all models)

The [Vercel AI Gateway](https://vercel.com/ai-gateway) gives you access to 40+ models from every provider with a single key — no markup on token pricing. Get your key at [vercel.com/ai-gateway](https://vercel.com/ai-gateway).

### Individual provider keys

If you prefer environment variables, set keys for the providers you want:

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # Claude models
export OPENAI_API_KEY=sk-...             # GPT models
export GOOGLE_GENERATIVE_AI_API_KEY=...  # Gemini models
```

Or store them persistently via the CLI:

```bash
yardstiq config set gateway-key your_key
yardstiq config set anthropic-key sk-ant-...
yardstiq config set openai-key sk-...
yardstiq config set google-key your_key
```

> **Tip:** Environment variables take priority over saved config. If you have `AI_GATEWAY_API_KEY` set, yardstiq will fall back to the gateway when a direct provider key is missing. You can mix both approaches.

### Local models (Ollama)

No API key needed. Just have [Ollama](https://ollama.com) running:

```bash
yardstiq "hello" -m local:llama3.2 -m local:mistral
```

## Usage

### Basic comparison

```bash
yardstiq "Write a Python fibonacci function" -m claude-sonnet -m gpt-4o
```

### Compare 3+ models

```bash
yardstiq "Explain monads simply" -m claude-sonnet -m gpt-4o -m gemini-flash
```

### Use any model via AI Gateway

With `AI_GATEWAY_API_KEY` set, use `provider/model` format to access any model:

```bash
yardstiq "Hello" -m anthropic/claude-sonnet-4.6 -m openai/gpt-4o -m xai/grok-3
```

### Pipe from stdin

```bash
echo "Explain the CAP theorem" | yardstiq -m claude-sonnet -m gpt-4o
cat prompt.txt | yardstiq -m claude-haiku -m gpt-4o-mini
```

### Read prompt from file

```bash
yardstiq -f ./prompt.txt -m claude-sonnet -m gpt-4o
```

### Add a system prompt

```bash
yardstiq "Review this code" -s "You are an expert code reviewer" -m claude-sonnet -m gpt-4o
```

### AI judge

Let an AI evaluate which response is better:

```bash
yardstiq "Write a sorting algorithm" -m claude-sonnet -m gpt-4o --judge
```

Use a specific model as judge with custom criteria:

```bash
yardstiq "Explain DNS" -m claude-sonnet -m gpt-4o \
  --judge --judge-model gpt-4.1 \
  --judge-criteria "Focus on accuracy and beginner-friendliness"
```

### Export results

```bash
# JSON (for scripting)
yardstiq "hello" -m claude-sonnet -m gpt-4o --json > results.json

# Markdown
yardstiq "hello" -m claude-sonnet -m gpt-4o --markdown > comparison.md

# HTML (self-contained, dark theme)
yardstiq "hello" -m claude-sonnet -m gpt-4o --html > comparison.html
```

### Save and review later

```bash
yardstiq "Explain quicksort" -m claude-sonnet -m gpt-4o --save quicksort
yardstiq history list
yardstiq history show quicksort
```

### Tune parameters

```bash
yardstiq "Be creative" -m claude-sonnet -m gpt-4o \
  -t 0.8 \              # temperature
  --max-tokens 4096 \   # max output length
  --timeout 120          # seconds per model
```

### Disable streaming

```bash
yardstiq "hello" -m claude-sonnet -m gpt-4o --no-stream
```

## Models

Run `yardstiq models` to see all 40 built-in models with pricing and access status.

| Provider | Models | Aliases |
|----------|--------|---------|
| **Anthropic** | Claude Sonnet 4.6, Haiku 4.5, Opus 4.6, 3.5 Sonnet | `claude-sonnet`, `claude-haiku`, `claude-opus`, `claude-3.5-sonnet` |
| **OpenAI** | GPT-4o, 4o Mini, 4.1, 4.1 Mini/Nano, 5, 5 Mini/Nano, o3-mini, Codex Mini | `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`, `codex-mini` |
| **Google** | Gemini 2.5 Pro/Flash/Flash Lite, 3 Flash/Pro | `gemini-pro`, `gemini-flash`, `gemini-flash-lite`, `gemini-3-flash`, `gemini-3-pro` |
| **DeepSeek** | V3.2, R1 | `deepseek`, `deepseek-r1` |
| **Mistral** | Large 3, Magistral Medium/Small, Codestral | `mistral-large`, `magistral-medium`, `magistral-small`, `codestral` |
| **Meta** | Llama 4 Maverick/Scout, 3.3 70B | `llama-4-maverick`, `llama-4-scout`, `llama-3.3-70b` |
| **xAI** | Grok 3 | `grok-3` |
| **Amazon** | Nova Pro, Nova Lite | `nova-pro`, `nova-lite` |
| **Cohere** | Command A | `command-a` |
| **Alibaba** | Qwen 3.5 Flash/Plus | `qwen3.5-flash`, `qwen3.5-plus` |
| **Moonshot** | Kimi K2, K2.5 | `kimi-k2`, `kimi-k2.5` |
| **MiniMax** | M2.5 | `minimax-m2.5` |

**Status key:** `✓ key` = direct API key configured, `✓ gw` = available via AI Gateway, `✗` = no access

### Model formats

| Format | Example | Description |
|--------|---------|-------------|
| Alias | `claude-sonnet` | Built-in shorthand for popular models |
| Gateway | `openai/gpt-5.2` | Any model via AI Gateway (`provider/model`) |
| Local | `local:llama3.2` | Ollama models |

## CLI Reference

```
Usage: yardstiq [options] [command] [prompt...]

Compare AI model outputs side-by-side in your terminal

Arguments:
  prompt                         The prompt to send to all models

Options:
  -V, --version                  output the version number
  -m, --model <models...>        Models to compare (at least 2)
  -s, --system <message>         System prompt for all models
  -f, --file <path>              Read prompt from file
  -t, --temperature <n>          Temperature (default: 0)
  --max-tokens <n>               Max tokens per response (default: 2048)
  --judge                        Use AI judge to evaluate responses
  --judge-model <model>          Model for judging (default: "claude-sonnet")
  --judge-criteria <text>        Custom judging criteria
  --no-stream                    Disable streaming
  --json                         Output as JSON
  --markdown                     Output as Markdown
  --html                         Output as HTML
  --save [name]                  Save results to history
  --timeout <seconds>            Timeout per model (default: 60)
  -v, --verbose                  Show debug info
  -h, --help                     display help for command

Commands:
  setup [--provider <name>]      Interactive API key setup
  models                         List available models and pricing
  history [action] [name]        Browse saved comparisons
  config <action> [key] [value]  Manage configuration
  bench [options] <file>         Run a benchmark suite
```

### `yardstiq setup`

Interactive wizard to configure API keys. Keys are saved to `~/.yardstiq/config.json` and loaded automatically on every run.

```bash
# Guided setup — select providers from a list
yardstiq setup

# Configure a single provider directly
yardstiq setup --provider gateway
yardstiq setup --provider anthropic
yardstiq setup --provider openai
yardstiq setup --provider google
```

### `yardstiq models`

List all available models with pricing and access status.

```bash
yardstiq models
```

### `yardstiq config`

Manage configuration values (API keys, defaults).

```bash
# List all current config
yardstiq config list

# Get a specific value
yardstiq config get gateway-key
yardstiq config get temperature

# Set values
yardstiq config set gateway-key your_key
yardstiq config set anthropic-key sk-ant-...
yardstiq config set openai-key sk-...
yardstiq config set google-key your_key
yardstiq config set temperature 0.7
yardstiq config set max-tokens 4096
yardstiq config set judge-model gpt-4.1
```

### `yardstiq history`

Save and revisit past comparisons.

```bash
# Save a comparison
yardstiq "Explain quicksort" -m claude-sonnet -m gpt-4o --save quicksort

# List all saved comparisons
yardstiq history list

# Show a saved comparison
yardstiq history show quicksort

# Clear all history
yardstiq history clear
```

### `yardstiq bench`

Run a YAML-defined benchmark suite across multiple models.

```bash
# Run a built-in benchmark
yardstiq bench benchmarks/coding.yaml

# Save benchmark results
yardstiq bench benchmarks/reasoning.yaml --save reasoning-test

# Output results as JSON
yardstiq bench benchmarks/writing.yaml --json > results.json
```

## Development

```bash
git clone https://github.com/stanleycyang/yardstiq.git
cd yardstiq
pnpm install
pnpm build           # Build with tsup
pnpm dev             # Watch mode
pnpm test            # Run tests
pnpm test:coverage   # Run tests with 100% coverage enforcement
pnpm typecheck       # Type check
pnpm lint            # Lint with Biome
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes with tests
4. Ensure `pnpm test:coverage` passes at 100%
5. Submit a pull request

## License

[MIT](LICENSE)
