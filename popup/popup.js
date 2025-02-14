document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('youtube.com/watch')) {
    document.getElementById('loading').classList.remove('hidden');
    
    try {
      // Use Promise-based messaging
      const videoInfo = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (!response || !response.transcript) {
            reject(new Error('Invalid video info received'));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Video Info received:', videoInfo);
      
      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzeVideo',
        videoInfo: videoInfo
      });
      
      if (!analysis) {
        throw new Error('No analysis received from background script');
      }
      
      updatePopup(analysis);
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('results').innerHTML = `Error: ${error.message}`;
    }
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