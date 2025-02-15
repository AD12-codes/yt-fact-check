// Google OAuth authentication handler
class GoogleAuth {
  constructor() {
    this.userInfo = null;
  }

  async signIn() {
    try {
      // Launch Google sign-in popup
      const authToken = await chrome.identity.getAuthToken({
        interactive: true,
      });

      // Fetch user info using the token
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${authToken.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      this.userInfo = await response.json();

      // Store user info in chrome storage
      await chrome.storage.sync.set({ userInfo: this.userInfo });

      return this.userInfo;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  async signOut() {
    try {
      // Clear auth token
      const authToken = await chrome.identity.getAuthToken({
        interactive: false,
      });
      if (authToken) {
        await chrome.identity.removeCachedAuthToken({ token: authToken.token });
      }

      // Clear stored user info
      await chrome.storage.sync.remove("userInfo");
      this.userInfo = null;

      return true;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      // Try to get stored user info
      const data = await chrome.storage.sync.get("userInfo");
      this.userInfo = data.userInfo || null;
      return this.userInfo;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async isSignedIn() {
    const user = await this.getCurrentUser();
    return !!user;
  }
}
