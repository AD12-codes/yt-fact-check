# YouTube Fact Check Extension - Task List

## Phase 1: Understanding Current Implementation ✓

- [x] Review current UI screenshots
  - Dark-themed modern UI
  - Trust Score display with color coding (green for high scores)
  - Fact checks section with claims, verification status, and sources
- [x] Analyze existing response data structure
  - Video Info Object:
    - title: Video title from YouTube
    - description: Video description (can be empty)
    - transcript: Timestamped transcript of video content
    - url: YouTube video URL
  - Gemini API Response:
    - candidates: Array containing analysis results
      - Trust Score (0-100)
      - Claims Analysis (multiple claims)
      - Each claim has: statement, verification status, and detailed sources
    - usageMetadata: Token usage statistics
    - modelVersion: Gemini model version
- [x] Document current workflow
  - Automatic analysis on popup open
  - Transcript extraction through button click
  - Real-time fact-checking using Gemini API

## Phase 2: Authentication Implementation ⏳

- [x] Add Google Sign-in button to homepage
  - Added sign-in/sign-out UI
  - Implemented authentication state management
  - Created auth.js for Google OAuth handling
- [x] Implement OAuth flow for Gmail login
  - Added required permissions in manifest.json
  - Need to set up Google Cloud Project
  - Need to configure OAuth credentials
- [x] Display user information after login:
  - [x] Profile picture
  - [x] Name
  - [x] Email

## Phase 3: YouTube Integration

- [x] Check if current tab is YouTube
  - [x] If not YouTube: Show "Open YouTube" button
  - [x] If YouTube: Show "Play video" message
- [ ] Remove automatic video analysis
- [ ] Add video detection:
  - [ ] Display current video title
  - [ ] Show video URL
  - [ ] Add manual "Analyze" button

## Phase 4: Analysis Flow

- [ ] Implement manual analysis trigger
- [ ] Show loading state during analysis
- [ ] Display analysis results
- [ ] Error handling

## Phase 5: Testing & Optimization

- [ ] Test authentication flow
- [ ] Test YouTube detection
- [ ] Test manual analysis trigger
- [ ] Performance optimization
- [ ] UI/UX improvements

## Notes

- Keep existing API key implementation
- Remove automatic analysis trigger
- Focus on user-initiated actions
