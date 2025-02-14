document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('youtube.com/watch')) {
    document.getElementById('loading').classList.remove('hidden');
    // Get video info from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, async (videoInfo) => {
      alert(JSON.stringify(videoInfo));
      // Add error checking for videoInfo
      if (!videoInfo) {
        console.error('No video info received from content script');
        return;
      }
      
      console.log('Video Info 1:', videoInfo);
      try {
        const analysis = await chrome.runtime.sendMessage({
          action: 'analyzeVideo',
          videoInfo: videoInfo
        });
        console.log('Analysis:', analysis);
        
        if (!analysis) {
          console.error('No analysis received from background script');
          return;
        }
        
        updatePopup(analysis);
      } catch (error) {
        console.error('Error getting analysis:', error);
      }
    });
  } else {
    document.getElementById('results').innerHTML = 'Please open a YouTube video to analyze.';
  }
});

function updatePopup(analysis) {
  analysis = analysis.data;
  // {"success":true,"data":{"trustScore":60,"factChecks":[{"claim":"No claims could be extracted from the video","verified":false,"sources":["Analysis did not yield any verifiable claims"]}]}}
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('trustScore').textContent = `${analysis.trustScore}%`;
  
  const factChecksContainer = document.getElementById('factChecks');
  factChecksContainer.innerHTML = '';
  alert(JSON.stringify(analysis));
  if (analysis.factChecks) {
  analysis.factChecks.forEach(fact => {
    const factElement = document.createElement('div');
    factElement.className = 'fact-item';
    factElement.innerHTML = `
      <strong>Claim:</strong> ${fact.claim}<br>
      <strong>Status:</strong> ${fact.verified ? 'Verified' : 'Unverified'}<br>
      <strong>Sources:</strong> ${fact.sources.join(', ')}
    `;
    factChecksContainer.appendChild(factElement);
  });
}
} 