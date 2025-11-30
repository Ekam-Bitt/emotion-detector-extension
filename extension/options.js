document.addEventListener("DOMContentLoaded", () => {
  const apiBaseUrlInput = document.getElementById("apiBaseUrl");
  const saveButton = document.getElementById("saveButton");
  const statusDiv = document.getElementById("status");

  // Load saved API Base URL
  chrome.storage.sync.get({ apiBaseUrl: "http://api:8000" }, (items) => {
    apiBaseUrlInput.value = items.apiBaseUrl;
  });

  // Save API Base URL
  saveButton.addEventListener("click", () => {
    const apiBaseUrl = apiBaseUrlInput.value;
    chrome.storage.sync.set({ apiBaseUrl: apiBaseUrl }, () => {
      statusDiv.textContent = "Options saved.";
      setTimeout(() => {
        statusDiv.textContent = "";
      }, 750);
    });
  });
});
