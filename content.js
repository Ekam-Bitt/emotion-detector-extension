// Grab text nodes from common elements
function extractText() {
  let elements = document.querySelectorAll("p, span, div, li");
  return Array.from(elements)
    .map((el) => el.innerText)
    .filter(Boolean)
    .slice(0, 50); // limit for MVP
}

// Send extracted text to background for analysis
chrome.runtime.sendMessage({
  action: "analyze",
  text: extractText(),
});
