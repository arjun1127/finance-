require("dotenv").config();
const { streamText } = require("ai");
const { google } = require("@ai-sdk/google");
async function run() {
  const result = streamText({
    model: google("gemini-1.5-flash"),
    prompt: "hi"
  });
  console.log("toUIMessageStreamResponse type:", typeof result.toUIMessageStreamResponse);
}
run();
