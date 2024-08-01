let currentBlockedSites = [];

function isURLBlocked(url, blockedSites) {
  const hostname = new URL(url).hostname.toLowerCase();
  return blockedSites.some(site => hostname === site.toLowerCase() || hostname.endsWith(`.${site.toLowerCase()}`));
}

function hideBlockedResults(blockedSites) {
  if (window.location.hostname.includes('google')) {
    const results = document.querySelectorAll('.g');
    results.forEach((result) => {
      const link = result.querySelector('a');
      if (link && link.href && isURLBlocked(link.href, blockedSites)) {
        result.style.display = 'none';
      } else {
        result.style.display = '';
      }
    });
  } else if (window.location.hostname.includes('bing')) {
    const results = document.querySelectorAll('.b_algo');
    results.forEach((result) => {
      const link = result.querySelector('a');
      if (link && link.href && isURLBlocked(link.href, blockedSites)) {
        result.style.display = 'none';
      } else {
        result.style.display = '';
      }
    });
  } else if (window.location.hostname.includes('baidu')) {
    const results = document.querySelectorAll('.result, .c-container');
    results.forEach((result) => {
      const link = result.querySelector('a');
      const displayUrl = result.querySelector('.c-showurl');
      
      let shouldHide = false;
      
      if (link && link.href) {
        shouldHide = isURLBlocked(link.href, blockedSites);
      }
      
      if (!shouldHide && displayUrl) {
        const displayUrlText = displayUrl.textContent.trim();
        if (displayUrlText) {
          const fakeUrl = `http://${displayUrlText}`;
          shouldHide = isURLBlocked(fakeUrl, blockedSites);
        }
      }
      
      if (shouldHide) {
        result.style.display = 'none';
      } else {
        result.style.display = '';
      }
    });
  }
}

function applyBlockedSites(blockedSites) {
  currentBlockedSites = blockedSites;
  hideBlockedResults(blockedSites);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        hideBlockedResults(currentBlockedSites);
      }
    });
  });

  let resultsContainer;
  if (window.location.hostname.includes('google')) {
    resultsContainer = document.querySelector('#rcnt');
  } else if (window.location.hostname.includes('bing')) {
    resultsContainer = document.querySelector('#b_results');
  } else if (window.location.hostname.includes('baidu')) {
    resultsContainer = document.querySelector('#content_left');
  }

  if (resultsContainer) {
    observer.observe(resultsContainer);
  }

  const mutationObserver = new MutationObserver(() => {
    hideBlockedResults(currentBlockedSites);
  });
  
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('scroll', () => {
    hideBlockedResults(currentBlockedSites);
  });
}

function updateBlockedSites() {
  chrome.runtime.sendMessage({ action: "getBlockedSites" }, (response) => {
    if (response && response.blockedSites) {
      applyBlockedSites(response.blockedSites);
    }
  });
}

// 初始化
updateBlockedSites();

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedSites) {
    applyBlockedSites(changes.blockedSites.newValue);
  }
});

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateBlockedSites();
  }
});

// 定期更新（每60秒）
setInterval(updateBlockedSites, 60000);