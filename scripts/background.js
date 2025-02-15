import { GeminiAPI } from "../api/gemini.js";

const gemini = new GeminiAPI("API_KEY_HERE");

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeVideo") {
    console.log("Analyzing video:", request.videoInfo);

    analyzeVideo(request.videoInfo)
      .then((result) => {
        if (!result) {
          throw new Error("Analysis returned no results");
        }
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error("Error analyzing video:", error);
        sendResponse({
          success: false,
          error: error.message || "Failed to analyze video",
          details:
            error.status === 403 ? "Video URL access denied or expired" : null,
        });
      });
    return true;
  }
});

async function analyzeVideo(videoInfo) {
  try {
    const analysis = await gemini.analyzeContent(videoInfo);
    return analysis;
  } catch (error) {
    console.error("Error in video analysis:", error);
    return {
      error: "Failed to analyze video",
      details: error.message,
    };
  }
}
