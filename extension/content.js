// Platform-specific comment selectors
const SELECTORS = {
  "www.youtube.com": "ytd-comment-thread-renderer #content-text",
  "twitter.com": '[data-testid="tweetText"]',
  "x.com": '[data-testid="tweetText"]',
  "www.reddit.com": [
    ".Post ._292iotee39Lmt0MkQZ2hPV", // Old Reddit comment text
    "shreddit-comment-body", // New Reddit comment text
    "div[data-testid='comment'] p", // General comment paragraph
  ],
};

function waitForComments(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations, obs) => {
      let elements = [];
      if (Array.isArray(selector)) {
        for (const s of selector) {
          elements = document.querySelectorAll(s);
          if (elements.length > 0) break;
        }
      } else {
        elements = document.querySelectorAll(selector);
      }

      if (elements.length > 0) {
        obs.disconnect();
        const comments = Array.from(elements)
          .map((el) => el.innerText)
          .filter(Boolean);
        resolve(comments);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timeout waiting for comments"));
    }, timeout);
  });
}

async function extractText() {
  const hostname = window.location.hostname;
  console.log("Spectrum extension: Hostname:", hostname);

  const selector = SELECTORS[hostname];
  console.log("Spectrum extension: Selector:", selector);

  if (selector) {
    try {
      const comments = await waitForComments(selector);
      console.log("Spectrum extension: Extracted comments:", comments);
      return comments;
    } catch (error) {
      console.error("Spectrum extension:", error);
      return [];
    }
  }

  // Fallback for unknown platforms
  let elements = document.querySelectorAll("p, span, div, li");
  return Array.from(elements)
    .map((el) => el.innerText)
    .filter(Boolean)
    .slice(0, 50); // limit for MVP
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_comments") {
    extractText().then((comments) => {
      sendResponse({ comments });
    });
    return true; // Keep the message channel open for the async response
  }
});
