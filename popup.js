document.addEventListener('DOMContentLoaded', () => {
  const newSiteInput = document.getElementById('newSite');
  const addSiteButton = document.getElementById('addSite');
  const blockedSitesList = document.getElementById('blockedSitesList');
  const manageUrlsButton = document.getElementById('manageUrls');

  function updateBlockedSitesList() {
    chrome.storage.sync.get("blockedSites", (data) => {
      blockedSitesList.innerHTML = '';
      const sites = data.blockedSites || [];
      sites.slice(0, 6).forEach((site) => {
        const li = document.createElement('li');
        const siteSpan = document.createElement('span');
        siteSpan.textContent = site;
        li.appendChild(siteSpan);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeSite(site);
        li.appendChild(removeButton);
        blockedSitesList.appendChild(li);
      });
    });
  }

  function addSite() {
    const newSite = newSiteInput.value.trim();
    if (newSite) {
      chrome.storage.sync.get("blockedSites", (data) => {
        const blockedSites = data.blockedSites || [];
        if (!blockedSites.includes(newSite)) {
          blockedSites.push(newSite);
          chrome.storage.sync.set({ blockedSites }, () => {
            updateBlockedSitesList();
            newSiteInput.value = '';
          });
        }
      });
    }
  }

  function removeSite(site) {
    chrome.storage.sync.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites.filter((s) => s !== site);
      chrome.storage.sync.set({ blockedSites }, updateBlockedSitesList);
    });
  }

  addSiteButton.addEventListener('click', addSite);

  manageUrlsButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'manage.html' });
  });

  updateBlockedSitesList();
});