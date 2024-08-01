document.addEventListener('DOMContentLoaded', () => {
  const newSitesTextarea = document.getElementById('newSites');
  const addSitesButton = document.getElementById('addSites');
  const blockedSitesList = document.getElementById('blockedSitesList');
  const deleteAllButton = document.getElementById('deleteAll');
  const batchDeleteButton = document.getElementById('batchDelete');
  const confirmBatchDeleteButton = document.getElementById('confirmBatchDelete');
  const cancelBatchDeleteButton = document.getElementById('cancelBatchDelete');
  const batchDeleteActions = document.getElementById('batchDeleteActions');

  let batchDeleteMode = false;

  function isValidUrl(url) {
    try {
      new URL(url.startsWith('http') ? url : `http://${url}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateBlockedSitesList() {
    chrome.storage.sync.get("blockedSites", (data) => {
      blockedSitesList.innerHTML = '';
      const sites = data.blockedSites || [];
      sites.forEach((site, index) => {
        const li = document.createElement('li');
        
        if (batchDeleteMode) {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'batch-checkbox';
          checkbox.dataset.site = site;
          li.appendChild(checkbox);
        }

        const numberSpan = document.createElement('span');
        numberSpan.textContent = `${index + 1}.`;
        numberSpan.className = 'number';
        li.appendChild(numberSpan);

        const siteSpan = document.createElement('span');
        siteSpan.textContent = site;
        siteSpan.className = 'site';
        li.appendChild(siteSpan);

        if (!batchDeleteMode) {
          const removeButton = document.createElement('button');
          removeButton.innerHTML = '<i class="fas fa-trash"></i> Remove';
          removeButton.className = 'btn btn-danger';
          removeButton.onclick = () => removeSite(site);
          li.appendChild(removeButton);
        }

        blockedSitesList.appendChild(li);
      });
    });
  }

  function addSites() {
    const newSites = newSitesTextarea.value.split('\n').map(site => site.trim()).filter(site => site !== '');
    if (newSites.length === 0) return;

    const invalidUrls = newSites.filter(site => !isValidUrl(site));
    if (invalidUrls.length > 0) {
      alert(`The following URLs are invalid:\n${invalidUrls.join('\n')}\nPlease correct them and try again.`);
      return;
    }

    chrome.storage.sync.get("blockedSites", (data) => {
      let blockedSites = data.blockedSites || [];
      const newValidSites = newSites.filter(site => !blockedSites.includes(site));
      blockedSites = [...blockedSites, ...newValidSites];
      chrome.storage.sync.set({ blockedSites }, () => {
        updateBlockedSitesList();
        newSitesTextarea.value = '';
      });
    });
  }

  function removeSite(site) {
    chrome.storage.sync.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites.filter((s) => s !== site);
      chrome.storage.sync.set({ blockedSites }, updateBlockedSitesList);
    });
  }

  function deleteAll() {
    if (confirm("Are you sure you want to delete all blocked URLs?")) {
      chrome.storage.sync.set({ blockedSites: [] }, updateBlockedSitesList);
    }
  }

  function toggleBatchDeleteMode() {
    batchDeleteMode = !batchDeleteMode;
    batchDeleteActions.style.display = batchDeleteMode ? 'block' : 'none';
    updateBlockedSitesList();
  }

  function confirmBatchDelete() {
    const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
    if (checkboxes.length === 0) {
      alert("Please select at least one URL to delete.");
      return;
    }

    if (confirm(`Are you sure you want to delete ${checkboxes.length} selected URL(s)?`)) {
      chrome.storage.sync.get("blockedSites", (data) => {
        const blockedSites = data.blockedSites || [];
        const sitesToDelete = Array.from(checkboxes).map(cb => cb.dataset.site);
        const updatedSites = blockedSites.filter(site => !sitesToDelete.includes(site));
        chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
          toggleBatchDeleteMode();
          updateBlockedSitesList();
        });
      });
    }
  }

  addSitesButton.addEventListener('click', addSites);
  deleteAllButton.addEventListener('click', deleteAll);
  batchDeleteButton.addEventListener('click', toggleBatchDeleteMode);
  confirmBatchDeleteButton.addEventListener('click', confirmBatchDelete);
  cancelBatchDeleteButton.addEventListener('click', toggleBatchDeleteMode);

  updateBlockedSitesList();
});