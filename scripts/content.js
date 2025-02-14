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
    await this.sleep(2000);
    console.log('Transcript button clicked');
  }

  async getTranscript() {
    try {
      await this.openTranscript();
      // If transcript panel is already open, just get the content
      const transcriptContainer = await this.waitForElement('ytd-transcript-segment-list-renderer');
      console.log('Transcript container:', transcriptContainer);
      return this.extractTranscriptText(transcriptContainer);
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

  // Helper function to wait for an element to appear
  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
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
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    const analyzer = new YouTubeAnalyzer();
    const videoInfo =  await analyzer.getVideoInfo();
    console.log('Video Info:', videoInfo);
    sendResponse(videoInfo);
    return true; // Required for async response
  }
}); 