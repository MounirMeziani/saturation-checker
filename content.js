// Global variables to track state
let lastFullscreenElement = null;
let currentDomain = window.location.hostname;

// Cross-browser function to get the current fullscreen element
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

// Create a style element to hold our filter CSS
const styleElementId = 'grayscale-style-extension';
let styleElement = document.getElementById(styleElementId);
if (!styleElement) {
  styleElement = document.createElement('style');
  styleElement.id = styleElementId;
  document.head.appendChild(styleElement);
}

// Initialize the filter state
let isEnabled = false;
let intensity = 100;
let customWebsites = {}; // Store custom website settings

// Function to update the grayscale filter
function updateFilter() {
  if (isEnabled) {
    // Apply grayscale filter to the entire page
    styleElement.textContent = `
      html {
        filter: grayscale(${intensity}%) !important;
        -webkit-filter: grayscale(${intensity}%) !important;
      }
    `;
    
    // Apply the filter to the current fullscreen element, if any
    const fullscreenElement = getFullscreenElement();
    if (fullscreenElement) {
      fullscreenElement.style.filter = `grayscale(${intensity}%)`;
      lastFullscreenElement = fullscreenElement;
    }
  } else {
    // Remove the filter
    styleElement.textContent = '';
    
    // Remove the filter from the current fullscreen element, if any
    const fullscreenElement = getFullscreenElement();
    if (fullscreenElement) {
      fullscreenElement.style.filter = '';
    }
    lastFullscreenElement = null;
  }
}

// Load saved settings when the content script initializes
chrome.storage.sync.get({
  grayscaleSettings: {
    enabled: false,
    intensity: 100
  },
  customWebsites: {}
}, function(result) {
  customWebsites = result.customWebsites;
  
  // Check if current website has custom settings
  if (customWebsites[currentDomain]) {
    isEnabled = customWebsites[currentDomain].enabled;
    intensity = customWebsites[currentDomain].intensity;
  } else {
    isEnabled = result.grayscaleSettings.enabled;
    intensity = result.grayscaleSettings.intensity;
  }
  
  updateFilter();
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'updateFilter') {
    isEnabled = message.enabled;
    intensity = message.intensity;
    updateFilter();
    
    // If this is a site-specific update, store it
    if (message.siteSpecific) {
      // Nothing to do here, the popup will handle saving to storage
    }
  } else if (message.type === 'getStatus') {
    // Send back the current domain and settings
    sendResponse({
      domain: currentDomain,
      isCustom: !!customWebsites[currentDomain],
      enabled: isEnabled,
      intensity: intensity
    });
  }
  return true; // Keep the message channel open for async responses
});

// Handle fullscreen state changes
function handleFullscreenChange() {
  const currentFullscreenElement = getFullscreenElement();

  // If exiting fullscreen, remove the filter from the previous fullscreen element
  if (lastFullscreenElement && !currentFullscreenElement) {
    lastFullscreenElement.style.filter = '';
  }

  // Apply filter to the new fullscreen element if grayscale is enabled
  if (currentFullscreenElement && isEnabled) {
    currentFullscreenElement.style.filter = `grayscale(${intensity}%)`;
  }

  // Update the tracked fullscreen element
  lastFullscreenElement = currentFullscreenElement;
}

// Set up event listeners for fullscreen changes (cross-browser support)
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange); 