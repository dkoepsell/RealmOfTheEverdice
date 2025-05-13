// Simple script to test OpenAI API connection
import OpenAI from 'openai';

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    console.log("Sending a simple request to OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'OpenAI connection is working correctly!'" }
      ],
      max_tokens: 30
    });
    
    console.log("Response received successfully:");
    console.log(response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error("Error testing OpenAI API:", error.message);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }
    return false;
  }
}

// Run the test
testOpenAI().then(success => {
  if (success) {
    console.log("✅ OpenAI API connection test passed successfully!");
  } else {
    console.log("❌ OpenAI API connection test failed!");
  }
});