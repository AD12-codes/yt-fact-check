// class GeminiAPI {
//   constructor(apiKey) {
//     this.apiKey = apiKey;
//     this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
//   }

//   async analyzeContent(videoInfo) {
//     const prompt = `
//       Analyze the following YouTube video content for factual accuracy:
//       Title: ${videoInfo.title}
//       Description: ${videoInfo.description}
//       Transcript: ${videoInfo.transcript}
      
//       Please provide:
//       1. A trust score from 0-100
//       2. List of key claims and their verification status
//       3. Sources that contradict or support the claims
//     `;

//     try {
//       const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           contents: [{
//             parts: [{
//               text: prompt
//             }]
//           }]
//         })
//       });

//       const data = await response.json();
//       console.log('Raw Gemini API response:', data); // For debugging
//       return this.parseGeminiResponse(data);
//     } catch (error) {
//       console.error('Error analyzing content:', error);
//       throw error;
//     }
//   }

//   parseGeminiResponse(response) {
//     // Parse and structure the Gemini response
//     // This is a simplified version - you'll need to adapt based on actual response format
//     return {
//       trustScore: 85, // Example score
//       factChecks: [
//         {
//           claim: "Example claim",
//           verified: true,
//           sources: ["source1", "source2"]
//         }
//       ]
//     };
//   }
// }

// export default GeminiAPI; 