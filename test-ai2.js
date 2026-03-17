const { streamText } = require("ai");
const { google } = require("@ai-sdk/google");
async function run() {
  const result = streamText({
    model: google("gemini-2.5-flash"),
    prompt: "hi"
  });
  console.log("toDataStreamResponse type:", typeof result.toDataStreamResponse);
  console.log("toTextStreamResponse type:", typeof result.toTextStreamResponse);
}
run().catch(console.error);
