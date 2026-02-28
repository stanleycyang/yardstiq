# yardstiq

Compare AI model outputs side-by-side in your terminal. Send one prompt to multiple models, see their responses stream in parallel, and get performance stats (speed, tokens, cost) — all in a single command.

```
yardstiq "Explain quicksort in 3 sentences" -m claude-sonnet -m gpt-4o
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

## Install

### npm

```bash
npm install -g yardstiq
```

### pnpm

```bash
pnpm add -g yardstiq
```

### npx (no install)

```bash
npx yardstiq "your prompt" -m claude-sonnet -m gpt-4o
```

### From source

```bash
git clone https://github.com/stanleycyang/aidiff.git
cd aidiff
pnpm install
pnpm build
node dist/index.js --help
```

## Setup

yardstiq needs API keys to call models. You have two options:

### Option A: One key for everything (recommended)

Set `AI_GATEWAY_API_KEY` to access 100+ models from every provider through the [Vercel AI Gateway](https://vercel.com/ai-gateway) — no markup on token pricing.

```bash
export AI_GATEWAY_API_KEY=your_gateway_key
```

Get your key at [vercel.com/ai-gateway](https://vercel.com/ai-gateway).

### Option B: Individual provider keys

Set keys for the providers you want to use:

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # Claude models
export OPENAI_API_KEY=sk-...             # GPT models
export GOOGLE_GENERATIVE_AI_API_KEY=...  # Gemini models
export GROQ_API_KEY=...                  # Llama via Groq
export DEEPSEEK_API_KEY=...              # DeepSeek models
export MISTRAL_API_KEY=...               # Mistral models
```

> **Tip:** If you have `AI_GATEWAY_API_KEY` set, yardstiq will automatically fall back to the gateway when a direct provider key is missing. You can mix both approaches.

You can also store keys persistently:

```bash
yardstiq config set anthropic-key sk-ant-...
yardstiq config set openai-key sk-...
```

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

Run `yardstiq models` to see all available models with pricing and status:

```
Alias             Name                  Provider    Input/1M  Output/1M Status
────────────────────────────────────────────────────────────────────────────────
claude-sonnet     Claude Sonnet         anthropic   $3.00     $15.00    ✓ gw
claude-haiku      Claude Haiku          anthropic   $0.80     $4.00     ✓ gw
claude-opus       Claude Opus           anthropic   $15.00    $75.00    ✓ gw
gpt-4o            GPT-4o                openai      $2.50     $10.00    ✓ key
gpt-4o-mini       GPT-4o Mini           openai      $0.15     $0.60     ✓ key
gpt-4.1           GPT-4.1               openai      $2.00     $8.00     ✓ key
gpt-4.1-mini      GPT-4.1 Mini          openai      $0.40     $1.60     ✓ key
gpt-4.1-nano      GPT-4.1 Nano          openai      $0.10     $0.40     ✓ key
o3-mini           o3-mini               openai      $1.10     $4.40     ✓ key
gemini-pro        Gemini 2.0 Pro        google      $1.25     $10.00    ✓ gw
gemini-flash      Gemini 2.0 Flash      google      $0.10     $0.40     ✓ gw
llama3            Llama 3.1 70B         groq        $0.59     $0.79     ✓ gw
deepseek          DeepSeek Chat         deepseek    $0.14     $0.28     ✓ gw
mistral-large     Mistral Large         mistral     $2.00     $6.00     ✓ gw
```

**Status key:** `✓ key` = direct API key configured, `✓ gw` = available via AI Gateway, `✗` = no access

### Model formats

| Format | Example | Description |
|--------|---------|-------------|
| Alias | `claude-sonnet` | Built-in shorthand for popular models |
| Gateway | `openai/gpt-5.2` | Any model via AI Gateway (`provider/model`) |
| Full ID | `claude-sonnet-4-20250514` | Exact model version |
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
  models                         List available models and pricing
  history [action] [name]        Browse saved comparisons
  config <action> [key] [value]  Manage configuration
  bench [options] <file>          Run a benchmark suite
```

## Development

```bash
git clone https://github.com/stanleycyang/aidiff.git
cd aidiff
pnpm install
pnpm build        # Build with tsup
pnpm dev          # Watch mode
pnpm test         # Run tests
pnpm typecheck    # Type check
pnpm lint         # Lint with Biome
```

## License

MIT
