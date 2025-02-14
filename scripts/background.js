const GEMINI_API_KEY = 'AIzaSyBHfw9_EwrafNWDSfcksyobPUGMCbVyOA4';

class GeminiAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async analyzeContent(videoInfo) {
    const prompt = `
      Analyze the following YouTube video content for factual accuracy:
      Title: ${videoInfo.title}
      Description: ${videoInfo.description}
      Transcript: ${videoInfo.transcript}
      
      Please provide your analysis in the following format:

      Trust Score: [0-100] based on claims and status and sources

      Claims Analysis:
      Claim: [state the claim]
      Status: [Verified/Unverified]
      Source: [provide URL or reference]

      [Repeat for each major claim made in the video]

      Please be specific with sources and include URLs when possible.
      Please provide:

A clear percentage rating (0-100%) 
A detailed breakdown of the claims made in the statement
For each claim identified:

Supporting evidence from reputable sources
Any contradicting evidence
The specific dates and context where this information was verified


Links to fact-checking organizations that have investigated similar claims
Any important context or nuance that affects the accuracy rating

Please be thorough and cite specific sources. If any part of the stateme
    `;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw Gemini API response:', data); // For debugging
      return this.parseGeminiResponse(data);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  parseGeminiResponse(response) {
    try {
      if (!response || !response.candidates || !response.candidates[0] || !response.candidates[0].content) {
        console.error('Unexpected Gemini API response structure:', response);
        throw new Error('Invalid response structure');
      }

      const text = response.candidates[0].content.parts[0].text;
      console.log('Gemini Response:', text);

      // Extract trust score
      const trustScoreMatch = text.match(/Trust Score:\s*(\d+)/i);
      const trustScore = trustScoreMatch ? parseInt(trustScoreMatch[1]) : 0;

      // Extract true/false percentage
      const percentageMatch = text.match(/True\/False Percentage Rating:\s*(\d+)%/i);
      const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;

      // Extract claims analysis
      const factChecks = [];
      const claimSections = text.split(/\*\*Claim \d+:/);
      
      // Skip the first split as it's the intro text
      for (let i = 1; i < claimSections.length; i++) {
        const section = claimSections[i];
        
        // Extract claim text
        const claim = section.split('\n')[0].trim();
        
        // Extract status
        const statusMatch = section.match(/\*\*Status:\*\*\s*([^\n]+)/);
        const status = statusMatch ? statusMatch[1].trim() : 'Unverified';
        
        // Extract source
        const sourceMatch = section.match(/\*\*Source:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
        const source = sourceMatch ? sourceMatch[1].trim() : '';
        
        // Extract supporting evidence
        const supportingMatch = section.match(/\*\*Supporting Evidence:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
        const supporting = supportingMatch ? supportingMatch[1].trim() : '';
        
        // Extract contradicting evidence
        const contradictingMatch = section.match(/\*\*Contradicting Evidence:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
        const contradicting = contradictingMatch ? contradictingMatch[1].trim() : '';

        // Determine if verified based on status text
        const isVerified = status.toLowerCase().includes('verified') && 
                          !status.toLowerCase().includes('unverified');

        factChecks.push({
          claim: claim,
          verified: isVerified,
          status: status,
          sources: [source],
          supportingEvidence: supporting,
          contradictingEvidence: contradicting
        });
      }

      return {
        trustScore: trustScore,
        percentage: percentage,
        factChecks: factChecks.length > 0 ? factChecks : [{
          claim: "No claims could be extracted from the video",
          verified: false,
          status: "Error",
          sources: ["Analysis did not yield any verifiable claims"],
          supportingEvidence: "",
          contradictingEvidence: ""
        }]
      };

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Raw response:', response);
      return {
        trustScore: 0,
        percentage: 0,
        factChecks: [{
          claim: "Error analyzing video content",
          verified: false,
          status: "Error",
          sources: [`Failed to parse Gemini response: ${error.message}`],
          supportingEvidence: "",
          contradictingEvidence: ""
        }]
      };
    }
  }
}

// Initialize Gemini API
const gemini = new GeminiAPI(GEMINI_API_KEY);

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeVideo') {
    console.log('Analyzing video:', request.videoInfo);
    
    analyzeVideo(request.videoInfo)
      .then(result => {
        if (!result) {
          throw new Error('Analysis returned no results');
        }
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Error analyzing video:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to analyze video',
          details: error.status === 403 ? 'Video URL access denied or expired' : null
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
    console.error('Error in video analysis:', error);
    return {
      error: 'Failed to analyze video',
      details: error.message
    };
  }
} 