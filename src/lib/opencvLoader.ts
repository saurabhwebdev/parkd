/**
 * This file provides utilities to load and initialize OpenCV.js.
 * OpenCV.js is loaded as a WebAssembly module, so it's loaded asynchronously.
 */

// Define Module interface for OpenCV.js
declare global {
  interface Window {
    Module: {
      onRuntimeInitialized: () => void;
    };
  }
}

// OpenCV.js load status
let isOpenCVLoaded = false;
let isLoading = false;
let loadingPromise: Promise<void> | null = null;

// Callbacks to run once OpenCV is loaded
const onLoadCallbacks: (() => void)[] = [];

/**
 * Function that will be called when OpenCV.js is loaded
 */
function onOpenCVLoaded() {
  isOpenCVLoaded = true;
  isLoading = false;
  
  // Execute all the callbacks that were registered while loading
  onLoadCallbacks.forEach(callback => callback());
  onLoadCallbacks.length = 0;
  
  console.log('OpenCV.js loaded successfully');
}

/**
 * Load OpenCV.js script
 * @returns Promise that resolves when OpenCV.js is loaded
 */
export function loadOpenCV(): Promise<void> {
  // If OpenCV is already loaded, return a resolved promise
  if (isOpenCVLoaded) {
    return Promise.resolve();
  }
  
  // If OpenCV is already loading, return the existing promise
  if (isLoading && loadingPromise) {
    return loadingPromise;
  }
  
  // Start loading OpenCV
  isLoading = true;
  
  // Create a promise that will resolve when OpenCV is loaded
  loadingPromise = new Promise<void>((resolve, reject) => {
    try {
      // Register the callback to be called when OpenCV is loaded
      onLoadCallbacks.push(resolve);
      
      // Check if OpenCV.js script is already in the document
      if (document.getElementById('opencv-script')) {
        return;
      }
      
      // Set up the onload callback before creating the script
      // This is the correct event name that OpenCV.js will trigger
      window.Module = {
        onRuntimeInitialized: onOpenCVLoaded
      };
      
      // Create script element
      const script = document.createElement('script');
      script.id = 'opencv-script';
      script.setAttribute('async', '');
      script.setAttribute('type', 'text/javascript');
      
      // Set the source URL for OpenCV.js
      // Using a reliable CDN for better performance and availability
      script.src = 'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.min.js';
      
      // Add error handler
      script.onerror = () => {
        isLoading = false;
        loadingPromise = null;
        onLoadCallbacks.length = 0;
        reject(new Error('Failed to load OpenCV.js'));
      };
      
      // Append the script to the document
      document.head.appendChild(script);
      
    } catch (error) {
      isLoading = false;
      loadingPromise = null;
      reject(error);
    }
  });
  
  return loadingPromise;
}

/**
 * Check if OpenCV.js is loaded
 * @returns True if OpenCV.js is loaded, false otherwise
 */
export function isOpenCVReady(): boolean {
  return isOpenCVLoaded;
}

/**
 * Wait for OpenCV.js to be loaded
 * @returns Promise that resolves when OpenCV.js is loaded
 */
export function waitForOpenCV(): Promise<void> {
  if (isOpenCVLoaded) {
    return Promise.resolve();
  }
  
  return loadOpenCV();
} 