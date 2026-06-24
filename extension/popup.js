chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  const status = document.getElementById('status');
  const hint = document.getElementById('hint');
  if (url.includes('instagram.com')) {
    status.textContent = 'On Instagram — ready to scrape.';
    hint.textContent = 'Switch to the Outreach dashboard and click "Scrape Via Extension" to begin.';
  } else {
    status.textContent = 'Extension active.';
    hint.textContent = 'Open the Outreach dashboard and click “Scrape Via Extension” to scrape Instagram profiles.';
  }
});
