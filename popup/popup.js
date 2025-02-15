// Initialize authentication
const auth = new GoogleAuth();

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication status
  const isSignedIn = await auth.isSignedIn();
  updateUIForAuthState(isSignedIn);

  if (isSignedIn) {
    await initializeContent();
  }
});

// Authentication UI handlers
document.getElementById("signInButton").addEventListener("click", async () => {
  try {
    await auth.signIn();
    updateUIForAuthState(true);
    await initializeContent();
  } catch (error) {
    console.error("Sign in failed:", error);
  }
});

document.getElementById("signOutButton").addEventListener("click", async () => {
  try {
    await auth.signOut();
    updateUIForAuthState(false);
  } catch (error) {
    console.error("Sign out failed:", error);
  }
});

async function updateUIForAuthState(isSignedIn) {
  const preLoginContent = document.getElementById("preLoginContent");
  const postLoginHeader = document.getElementById("postLoginHeader");
  const contentSection = document.getElementById("contentSection");

  if (isSignedIn) {
    const user = await auth.getCurrentUser();
    document.getElementById("userAvatar").src = user.picture;

    preLoginContent.classList.add("hidden");
    postLoginHeader.classList.remove("hidden");
    contentSection.classList.remove("hidden");
  } else {
    preLoginContent.classList.remove("hidden");
    postLoginHeader.classList.add("hidden");
    contentSection.classList.add("hidden");
  }
}

async function initializeContent() {
  showLoading();
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.url.includes("youtube.com/watch")) {
      throw new Error("Please open a YouTube video to analyze.");
    }

    const videoInfo = await getVideoInfo(tab.id);
    const analysis = await analyzeVideo(videoInfo);
    updatePopup(analysis);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("results").innerHTML = `Error: ${error.message}`;
  } finally {
    hideLoading();
  }
}

function showLoading() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
}

async function getVideoInfo(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: "getVideoInfo" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!response || !response.transcript) {
        reject(new Error("Invalid video info received"));
      } else {
        resolve(response);
      }
    });
  });
}

async function analyzeVideo(videoInfo) {
  const analysis = await chrome.runtime.sendMessage({
    action: "analyzeVideo",
    videoInfo: videoInfo,
  });

  if (!analysis) {
    throw new Error("No analysis received from background script");
  }

  return analysis;
}

function updatePopup(analysis) {
  analysis = analysis.data;

  // Update trust score with color coding
  const trustScore = analysis.trustScore;
  const trustScoreElement = document.getElementById("trustScore");
  trustScoreElement.textContent = `${trustScore}%`;
  trustScoreElement.className = getTrustScoreClass(trustScore);

  const factChecksContainer = document.getElementById("factChecks");
  factChecksContainer.innerHTML = "";

  if (analysis.factChecks) {
    analysis.factChecks.forEach((fact) => {
      const factElement = document.createElement("div");
      factElement.className = "fact-item";
      factElement.innerHTML = `
        <div class="claim-container">
          <div class="label">Claim:</div>
          <div class="content">${fact.claim}</div>
        </div>
        
        <div class="status-container">
          <div class="label">Status:</div>
          <span class="${
            fact.verified ? "status-verified" : "status-unverified"
          }">
            ${fact.verified ? "Verified" : "Unverified"}
          </span>
        </div>
        
        <div class="sources-container">
          <div class="label">Sources:</div>
          <div class="content">${
            Array.isArray(fact.sources) ? fact.sources.join(", ") : fact.sources
          }</div>
        </div>
      `;
      factChecksContainer.appendChild(factElement);
    });
  }
}

function getTrustScoreClass(score) {
  const baseClasses = "trust-score";
  if (score >= 86) return `${baseClasses} score-green`;
  if (score >= 41) return `${baseClasses} score-yellow`;
  return `${baseClasses} score-red`;
}
