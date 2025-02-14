// Content script to extract video information
class YouTubeAnalyzer {
  constructor() {
    this.transcriptText = '';
    this.videoTitle = '';
    this.videoDescription = '';
  }

  async getVideoInfo() {
    // Wait for YouTube page to fully load
    await this.waitForElement('h1.ytd-video-primary-info-renderer');
    
    this.videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() || '';
    this.videoDescription = document.querySelector('ytd-expandable-video-description-body-text')?.textContent?.trim() || '';
    
    // Get transcript
   const transcript = await this.getTranscript();
    return {
      title: this.videoTitle,
      description: this.videoDescription,
      transcript: transcript,
      url: window.location.href
    };
  }

  async openTranscript() {
    const transcriptButton = document.querySelector('button[aria-label="Show transcript"]');
    transcriptButton.click();
    // await this.sleep(2000);
    console.log('Transcript button clicked');
  }

  async getTranscript() {
    try {
      await this.openTranscript();
      
      // Wait for transcript container and its content to load
      const transcriptContainer = await this.waitForElement('ytd-transcript-segment-list-renderer');
      console.log('Transcript container:', transcriptContainer);
      
      // Wait for at least one transcript segment to appear
      const hasSegments = await this.waitForElement('ytd-transcript-segment-renderer');
      if (!hasSegments) {
        throw new Error('Transcript segments did not load');
      }
      
      // Additional wait to ensure all segments are loaded
      await this.sleep(1000);
      
      const transcriptText = this.extractTranscriptText(transcriptContainer);
      if (!transcriptText) {
        throw new Error('Failed to extract transcript text');
      }
      
      return transcriptText;
    } catch (error) {
      console.error('Error getting transcript:', error);
      return 'Failed to load transcript. Please try opening it manually.';
    }
  }

  // Helper method to extract transcript text
  extractTranscriptText(container) {
    const segments = container.querySelectorAll('ytd-transcript-segment-renderer');
    return Array.from(segments)
      .map(segment => {
        const timestamp = segment.querySelector('div.segment-timestamp')?.textContent?.trim();
        const text = segment.querySelector('yt-formatted-string.segment-text')?.textContent?.trim();
        return `[${timestamp}] ${text}`;
      })
      .join('\n');
  }

  // Modify waitForElement to be more robust
  async waitForElement(selector, timeout = 2000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        // Additional check to ensure element is visible
        if (element.offsetParent !== null) {
          return element;
        }
      }
      await this.sleep(100);
    }
    
    return null;
  }

  // Helper function for sleeping
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    // Create a new analyzer instance
    const analyzer = new YouTubeAnalyzer();
    
    // Handle the async operation properly
    analyzer.getVideoInfo()
      .then(videoInfo => {
        console.log('Sending Video Info:', videoInfo);
        sendResponse(videoInfo);
      })
      .catch(error => {
        console.error('Error in getVideoInfo:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // This is crucial - keeps the message port open
  }
}); 