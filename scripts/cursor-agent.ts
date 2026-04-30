import { Agent } from "@cursor/sdk";

function getPromptFromArgs() {
  const [, , ...args] = process.argv;
  if (args.length === 0) {
    return "what we can improve into our applicaiton? can you give me a list of improvements? and also check did we have everything according to bulgarian invoicing compliance?";
  }

  return args.join(" ");
}

async function main() {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CURSOR_API_KEY. Export it before running this script.");
  }

  const prompt = getPromptFromArgs();
  const modelId = process.env.CURSOR_MODEL_ID || "default";

  const agent = await Agent.create({
    apiKey,
    model: { id: modelId },
    local: { cwd: process.cwd() },
  });
  try {
    const run = await agent.send(prompt);

    for await (const event of run.stream()) {
      if (event.type !== "assistant") continue;

      for (const block of event.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    }
  } finally {
    await agent[Symbol.asyncDispose]();
  }
  process.stdout.write("\n");
}

void main().catch((error: unknown) => {
  if (error instanceof Error) {
    const details = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: string }).code,
      isRetryable: (error as { isRetryable?: boolean }).isRetryable,
      cause: (error as { cause?: unknown }).cause,
    };

    process.stderr.write(`cursor-agent failed:\n${JSON.stringify(details, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  process.stderr.write(`cursor-agent failed: ${String(error)}\n`);
  process.exitCode = 1;
});
