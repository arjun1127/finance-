require("dotenv").config();
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");
async function run() {
  try {
    const result = await generateText({
      model: google("gemini-pro"),
      prompt: "hi"
    });
    console.log("Success result:", result.text);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
