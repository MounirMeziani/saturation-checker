document.addEventListener('DOMContentLoaded', function () {
  // Global settings elements
  const toggleFilter = document.getElementById('toggleFilter');
  const intensitySlider = document.getElementById('intensity');
  const intensityValue = document.getElementById('intensityValue');
  const saveButton = document.getElementById('saveSettings');
  
  // Custom website settings elements
  const currentDomainEl = document.getElementById('currentDomain');
  const customStatusEl = document.getElementById('customStatus');
  const addCustomWebsiteBtn = document.getElementById('addCustomWebsite');
  const customWebsiteContainer = document.getElementById('customWebsiteContainer');
  const customToggleFilter = document.getElementById('customToggleFilter');
  const customIntensitySlider = document.getElementById('customIntensity');
  const customIntensityValue = document.getElementById('customIntensityValue');
  const saveCustomSettingsBtn = document.getElementById('saveCustomSettings');
  const removeCustomSettingsBtn = document.getElementById('removeCustomSettings');
  
  // Variables to track state
  let currentDomain = '';
  let hasCustomSettings = false;
  let customWebsites = {};
  let globalSettings = {
    enabled: false,
    intensity: 100
  };

  // Load saved settings from storage and update UI controls
  function loadSettings() {
    chrome.storage.sync.get({
      grayscaleSettings: {
        enabled: false,
        intensity: 100
      },
      customWebsites: {}
    }, function(result) {
      // Store the global settings
      globalSettings = result.grayscaleSettings;
      customWebsites = result.customWebsites;
      
      // Update global settings UI
      toggleFilter.checked = globalSettings.enabled;
      intensitySlider.value = globalSettings.intensity;
      intensityValue.textContent = globalSettings.intensity;
      
      // Get current tab domain and see if it has custom settings
      getCurrentTabInfo();
    });
  }
  
  // Get current tab info and update UI
  function getCurrentTabInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'getStatus' }, function(response) {
          if (response) {
            currentDomain = response.domain;
            hasCustomSettings = response.isCustom;
            
            // Update UI with current domain
            currentDomainEl.textContent = currentDomain;
            
            if (hasCustomSettings) {
              customStatusEl.textContent = ' (has custom settings)';
              removeCustomSettingsBtn.classList.remove('hidden');
              
              // Update custom settings UI
              customToggleFilter.checked = response.enabled;
              customIntensitySlider.value = response.intensity;
              customIntensityValue.textContent = response.intensity;
            } else {
              customStatusEl.textContent = ' (using global settings)';
              removeCustomSettingsBtn.classList.add('hidden');
              
              // Initialize custom settings with global settings
              customToggleFilter.checked = globalSettings.enabled;
              customIntensitySlider.value = globalSettings.intensity;
              customIntensityValue.textContent = globalSettings.intensity;
            }
          }
        });
      }
    });
  }

  // Send message to update filter
  function sendMessage(siteSpecific = false) {
    const enabled = siteSpecific ? customToggleFilter.checked : toggleFilter.checked;
    const intensity = parseInt(siteSpecific ? customIntensitySlider.value : intensitySlider.value, 10);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'updateFilter',
          enabled: enabled,
          intensity: intensity,
          siteSpecific: siteSpecific
        });
      }
    });
  }

  // Save global settings
  saveButton.addEventListener('click', function() {
    const settings = {
      enabled: toggleFilter.checked,
      intensity: parseInt(intensitySlider.value, 10)
    };

    chrome.storage.sync.set({ grayscaleSettings: settings }, function() {
      console.log('Global settings saved', settings);
      globalSettings = settings;
      
      // Update active tab if it's not using custom settings
      if (!hasCustomSettings) {
        sendMessage();
      }
    });
  });

  // Show custom website settings UI
  addCustomWebsiteBtn.addEventListener('click', function() {
    customWebsiteContainer.classList.remove('hidden');
    addCustomWebsiteBtn.classList.add('hidden');
  });

  // Save custom website settings
  saveCustomSettingsBtn.addEventListener('click', function() {
    const customSettings = {
      enabled: customToggleFilter.checked,
      intensity: parseInt(customIntensitySlider.value, 10)
    };
    
    // Update the customWebsites object
    customWebsites[currentDomain] = customSettings;
    
    // Save to storage
    chrome.storage.sync.set({ customWebsites: customWebsites }, function() {
      console.log('Custom settings saved for', currentDomain, customSettings);
      hasCustomSettings = true;
      customStatusEl.textContent = ' (has custom settings)';
      removeCustomSettingsBtn.classList.remove('hidden');
      
      // Update the active tab
      sendMessage(true);
    });
  });
  
  // Remove custom website settings
  removeCustomSettingsBtn.addEventListener('click', function() {
    // Remove this domain from custom settings
    delete customWebsites[currentDomain];
    
    // Save updated customWebsites to storage
    chrome.storage.sync.set({ customWebsites: customWebsites }, function() {
      console.log('Custom settings removed for', currentDomain);
      hasCustomSettings = false;
      customStatusEl.textContent = ' (using global settings)';
      removeCustomSettingsBtn.classList.add('hidden');
      
      // Reset UI to global settings
      customToggleFilter.checked = globalSettings.enabled;
      customIntensitySlider.value = globalSettings.intensity;
      customIntensityValue.textContent = globalSettings.intensity;
      
      // Update the active tab with global settings
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateFilter',
            enabled: globalSettings.enabled,
            intensity: globalSettings.intensity
          });
        }
      });
    });
  });

  // Update the displayed slider value when it changes
  intensitySlider.addEventListener('input', function() {
    intensityValue.textContent = intensitySlider.value;
    // If the filter is enabled, update its intensity immediately
    if (toggleFilter.checked) {
      sendMessage();
    }
  });

  // Listen for changes to the toggle
  toggleFilter.addEventListener('change', function() {
    sendMessage();
  });
  
  // Custom intensity slider update
  customIntensitySlider.addEventListener('input', function() {
    customIntensityValue.textContent = customIntensitySlider.value;
    // If the custom filter is enabled, update its intensity immediately
    if (customToggleFilter.checked) {
      sendMessage(true);
    }
  });

  // Custom toggle filter change
  customToggleFilter.addEventListener('change', function() {
    sendMessage(true);
  });

  // Load settings when popup opens
  loadSettings();
}); 