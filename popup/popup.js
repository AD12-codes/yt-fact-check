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
  document.getElementById('loading').classList.add('hidden');
  
  // Update trust score with color coding
  const trustScore = analysis.trustScore;
  const trustScoreElement = document.getElementById('trustScore');
  trustScoreElement.textContent = `${trustScore}%`;
  trustScoreElement.className = getTrustScoreClass(trustScore);
  
  const factChecksContainer = document.getElementById('factChecks');
  factChecksContainer.innerHTML = '';
  
  if (analysis.factChecks) {
    analysis.factChecks.forEach(fact => {
      const factElement = document.createElement('div');
      factElement.className = 'fact-item';
      factElement.innerHTML = `
        <div class="claim-container">
          <div class="label">Claim:</div>
          <div class="content">${fact.claim}</div>
        </div>
        
        <div class="status-container">
          <div class="label">Status:</div>
          <span class="${fact.verified ? 'status-verified' : 'status-unverified'}">
            ${fact.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        
        <div class="sources-container">
          <div class="label">Sources:</div>
          <div class="content">${Array.isArray(fact.sources) ? fact.sources.join(', ') : fact.sources}</div>
        </div>
      `;
      factChecksContainer.appendChild(factElement);
    });
  }
}

function getTrustScoreClass(score) {
  const baseClasses = 'trust-score';
  if (score >= 86) return `${baseClasses} score-green`;
  if (score >= 41) return `${baseClasses} score-yellow`;
  return `${baseClasses} score-red`;
} 