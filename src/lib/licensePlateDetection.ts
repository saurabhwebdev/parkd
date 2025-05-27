import { createWorker } from 'tesseract.js';
import { loadOpenCV, waitForOpenCV } from './opencvLoader';

// Initialize Tesseract worker
let worker: Tesseract.Worker | null = null;

/**
 * Initialize the Tesseract worker
 */
export const initTesseract = async () => {
  if (!worker) {
    try {
      console.log('Initializing Tesseract worker...');
      worker = await createWorker('eng');
      // Set options to optimize for license plates
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      });
      console.log('Tesseract worker initialized successfully');
    } catch (error) {
      console.error('Error initializing Tesseract worker:', error);
      throw error;
    }
  }
  return worker;
};

/**
 * Preprocess the image to enhance license plate detection
 * @param imgElement HTML Image or Canvas element containing the captured image
 * @returns Processed image as canvas
 */
export const preprocessImage = async (imgElement: HTMLCanvasElement | HTMLImageElement) => {
  // Ensure OpenCV is loaded
  await waitForOpenCV();
  
  // @ts-ignore - cv is loaded globally by OpenCV.js
  const cv = window.cv;
  
  // Load the image into an OpenCV matrix
  const src = cv.imread(imgElement);
  
  // Create output matrix
  const dst = new cv.Mat();
  
  try {
    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur to reduce noise
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    // Apply adaptive threshold to create binary image
    cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    
    // Create a canvas to hold the processed image
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    
    return canvas;
  } finally {
    // Clean up OpenCV resources
    src.delete();
    dst.delete();
  }
};

/**
 * Detect license plate regions in an image
 * @param imgElement HTML Image or Canvas element containing the captured image
 * @returns Canvas with highlighted license plate region
 */
export const detectLicensePlateRegion = async (imgElement: HTMLCanvasElement | HTMLImageElement) => {
  // Ensure OpenCV is loaded
  await waitForOpenCV();
  
  // @ts-ignore - cv is loaded globally by OpenCV.js
  const cv = window.cv;
  
  // Load the image into an OpenCV matrix
  const src = cv.imread(imgElement);
  
  // Create output matrices
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  const hierarchy = new cv.Mat();
  const contours = new cv.MatVector();
  
  try {
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    // Detect edges using Canny
    cv.Canny(gray, edges, 50, 150, 3, false);
    
    // Find contours
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    
    // Create a copy of the source image for visualization
    const result = src.clone();
    
    // Variables to track the best potential license plate contour
    let maxArea = 0;
    let bestContour = -1;
    
    // Loop through contours to find potential license plates
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Filter by area
      if (area < 1000 || area > 15000) {
        continue;
      }
      
      // Get bounding rectangle
      const rect = cv.boundingRect(contour);
      const aspectRatio = rect.width / rect.height;
      
      // License plates typically have aspect ratios between 2 and 5
      if (aspectRatio >= 2 && aspectRatio <= 5) {
        if (area > maxArea) {
          maxArea = area;
          bestContour = i;
        }
      }
    }
    
    // If we found a potential license plate, draw it and extract the region
    if (bestContour !== -1) {
      const contour = contours.get(bestContour);
      const rect = cv.boundingRect(contour);
      
      // Draw rectangle around the potential license plate
      const point1 = new cv.Point(rect.x, rect.y);
      const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      cv.rectangle(result, point1, point2, [0, 255, 0, 255], 2);
      
      // Extract the region of interest (ROI)
      const roi = src.roi(rect);
      
      // Create a canvas for the result
      const canvas = document.createElement('canvas');
      cv.imshow(canvas, result);
      
      // Create a canvas for the ROI
      const roiCanvas = document.createElement('canvas');
      cv.imshow(roiCanvas, roi);
      
      roi.delete();
      
      return { 
        fullImage: canvas,
        plateRegion: roiCanvas,
        coordinates: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    } else {
      // If no plate was detected, return the original image with a message
      const canvas = document.createElement('canvas');
      cv.imshow(canvas, result);
      return { 
        fullImage: canvas,
        plateRegion: null,
        coordinates: null
      };
    }
  } finally {
    // Clean up OpenCV resources
    src.delete();
    gray.delete();
    edges.delete();
    hierarchy.delete();
    contours.delete();
  }
};

/**
 * Recognize text in the license plate region
 * @param plateCanvas Canvas element containing the license plate region
 * @returns Recognized license plate text
 */
export const recognizeLicensePlate = async (plateCanvas: HTMLCanvasElement) => {
  try {
    // Initialize Tesseract if not already done
    const ocrWorker = await initTesseract();
    
    // Recognize text in the plate region
    const { data } = await ocrWorker.recognize(plateCanvas);
    
    // Process the text to extract just the plate number
    // Remove spaces, newlines, and non-alphanumeric characters
    let text = data.text.replace(/[\r\n\s]+/g, '').replace(/[^A-Z0-9]/gi, '');
    
    // Convert to uppercase
    text = text.toUpperCase();
    
    // Return the processed text
    return text;
  } catch (error) {
    console.error('Error recognizing license plate:', error);
    return '';
  }
};

/**
 * Process an image to detect and recognize a license plate
 * @param imageElement HTML Image or Canvas element containing the captured image
 * @returns License plate text or empty string if none detected
 */
export const processLicensePlate = async (imageElement: HTMLCanvasElement | HTMLImageElement): Promise<string> => {
  try {
    console.log('Starting license plate processing');
    
    // Start loading OpenCV if not already loaded
    await loadOpenCV();
    console.log('OpenCV loaded');
    
    // Check if OpenCV is available
    // @ts-ignore - cv is loaded globally by OpenCV.js
    if (!window.cv) {
      console.error('OpenCV is not available');
      throw new Error('OpenCV is not available');
    }
    
    // Detect license plate region
    console.log('Detecting license plate region');
    const { plateRegion } = await detectLicensePlateRegion(imageElement);
    
    if (!plateRegion) {
      console.log('No license plate region detected');
      return '';
    }
    
    // Preprocess the plate region to enhance OCR accuracy
    console.log('Preprocessing plate region');
    const processedPlate = await preprocessImage(plateRegion);
    
    // Recognize text in the plate region
    console.log('Recognizing text in plate region');
    const plateText = await recognizeLicensePlate(processedPlate);
    
    console.log('License plate processing complete:', plateText);
    return plateText;
  } catch (error) {
    console.error('Error processing license plate:', error);
    throw error; // Re-throw to allow handling by the caller
  }
};

/**
 * Clean up resources when no longer needed
 */
export const cleanup = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}; 