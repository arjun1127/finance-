require("dotenv").config();
const { streamText } = require("ai");
const { google } = require("@ai-sdk/google");
async function run() {
  const result = streamText({
    model: google("gemini-1.5-flash"),
    prompt: "hi"
  });
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(result)).filter(key => typeof result[key] === 'function');
  console.log("Methods:", methods);
  console.log("toDataStreamResponse:", typeof result.toDataStreamResponse);
}
run().catch(console.error);
