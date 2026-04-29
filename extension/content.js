// This script runs at document_start for every page.

const checkAuth = () => {
  chrome.storage.local.get(['token'], (result) => {
    if (!result.token) {
      // Unauthenticated, block access
      const overlayUrl = chrome.runtime.getURL('overlay.html');
      
      // If we are already on the overlay URL, do nothing
      if (window.location.href === overlayUrl) return;

      // Simplest robust blocking mechanism for Manifest V3 extension:
      // Redirect to the extension's local overlay page.
      window.location.replace(overlayUrl + '?target=' + encodeURIComponent(window.location.href));
    }
  });
};

// Listen for messages from background script about auth state
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkAuth') {
    checkAuth();
  }
});

checkAuth();
