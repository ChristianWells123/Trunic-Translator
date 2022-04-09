async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
}

async function translatePage() {
  tabId = await getCurrentTab();
  console.log("executing on id " + tabId);
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['main.js']
  });
}

let fontUrl = chrome.runtime.getURL('resources/Trunic.woff');

let font = new FontFace("Trunic", "url('" + fontUrl + "')");
document.fonts.add(font);

document.getElementById('translate-button').addEventListener('click', () => translatePage(), false);