//console.log("Running popup.js");
let fontUrl = browser.runtime.getURL('resources/Trunic.woff');

let font = new FontFace("Trunic", "url('" + fontUrl + "')");
document.fonts.add(font);


document.getElementById('translate-button').addEventListener('click', () => browser.tabs.executeScript({file: "../main.js"}), false);