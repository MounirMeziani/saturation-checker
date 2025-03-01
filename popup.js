document.addEventListener('DOMContentLoaded', function () {
  const toggleFilter = document.getElementById('toggleFilter');
  const intensitySlider = document.getElementById('intensity');
  const intensityValue = document.getElementById('intensityValue');
  const saveButton = document.getElementById('saveSettings');

  // Load saved settings from storage and update UI controls.
  chrome.storage.sync.get({
    grayscaleSettings: {
      enabled: false,
      intensity: 100
    }
  }, function(result) {
    toggleFilter.checked = result.grayscaleSettings.enabled;
    intensitySlider.value = result.grayscaleSettings.intensity;
    intensityValue.textContent = result.grayscaleSettings.intensity;
  });

  function sendMessage() {
    const enabled = toggleFilter.checked;
    const intensity = parseInt(intensitySlider.value, 10);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'updateFilter',
          enabled: enabled,
          intensity: intensity
        });
      }
    });
  }

  // New: Save settings to chrome.storage and update the active tab.
  saveButton.addEventListener('click', function() {
    const settings = {
      enabled: toggleFilter.checked,
      intensity: parseInt(intensitySlider.value, 10)
    };

    chrome.storage.sync.set({ grayscaleSettings: settings }, function() {
      console.log('Settings saved', settings);
      // Optionally update the active tab immediately after saving.
      sendMessage();
    });
  });

  // Update the displayed slider value when it changes.
  intensitySlider.addEventListener('input', function () {
    intensityValue.textContent = intensitySlider.value;
    // If the filter is enabled, update its intensity immediately.
    if (toggleFilter.checked) {
      sendMessage();
    }
  });

  // Listen for changes to the toggle.
  toggleFilter.addEventListener('change', function () {
    sendMessage();
  });
}); 