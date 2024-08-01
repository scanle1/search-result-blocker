chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ blockedSites: [] });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBlockedSites") {
    chrome.storage.sync.get("blockedSites", (data) => {
      sendResponse({ blockedSites: data.blockedSites });
    });
  }
  return true;
});