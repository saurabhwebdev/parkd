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
      // These settings are optimized for license plate recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_pageseg_mode: '7', // Treat the image as a single text line
        preserve_interword_spaces: '0',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_ocr_engine_mode: '2', // Use LSTM only
        // @ts-ignore - tesseract.js types are not complete
        tessedit_create_txt: '1',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_create_hocr: '0',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_create_alto: '0',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_create_tsv: '0',
        // @ts-ignore - tesseract.js types are not complete
        tessedit_create_pdf: '0',
        // @ts-ignore - tesseract.js types are not complete
        tessjs_create_osd: '0',
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
    console.log('Preprocessing image of size:', src.cols, 'x', src.rows);
    
    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    
    // Apply bilateral filter to preserve edges while reducing noise
    // This is better than Gaussian blur for text
    const filtered = new cv.Mat();
    cv.bilateralFilter(dst, filtered, 9, 75, 75, cv.BORDER_DEFAULT);
    
    // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    // This improves contrast in the image
    const clahe = new cv.CLAHE(3.0, new cv.Size(8, 8));
    const enhanced = new cv.Mat();
    clahe.apply(filtered, enhanced);
    
    // Use adaptive thresholding to create a binary image
    // This helps separate text from background
    cv.adaptiveThreshold(
      enhanced, 
      dst, 
      255, 
      cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
      cv.THRESH_BINARY, 
      11, 
      2
    );
    
    // Optional: Apply morphological operations to improve character shapes
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    
    // Opening (erode then dilate) to remove noise
    cv.morphologyEx(dst, dst, cv.MORPH_OPEN, kernel);
    
    // Dilate to make characters more robust
    cv.dilate(dst, dst, kernel, new cv.Point(-1, -1), 1);
    
    // Create a canvas to hold the processed image
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    
    // Clean up intermediate matrices
    filtered.delete();
    enhanced.delete();
    kernel.delete();
    
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
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const hierarchy = new cv.Mat();
  const contours = new cv.MatVector();
  
  try {
    console.log('Image dimensions:', src.cols, 'x', src.rows);
    
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    // Apply adaptive threshold to create binary image
    // This can help with detecting text better than just edge detection
    const binary = new cv.Mat();
    cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    
    // Detect edges using Canny
    cv.Canny(blurred, edges, 30, 200, 3, false);
    
    // Find contours from both binary and edges for better detection
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    
    // Create a copy of the source image for visualization
    const result = src.clone();
    
    // Draw all contours for debugging
    cv.drawContours(result, contours, -1, [255, 0, 0, 255], 1);
    
    // Variables to track the best potential license plate contour
    let bestArea = 0;
    let bestContour = -1;
    
    // Loop through contours to find potential license plates
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // More relaxed size filtering - adjust based on image resolution
      // The size thresholds depend on the camera resolution and distance
      const minArea = Math.max(500, src.cols * src.rows * 0.005); // At least 0.5% of image
      const maxAreaThreshold = src.cols * src.rows * 0.2; // At most 20% of image
      
      if (area < minArea || area > maxAreaThreshold) {
        continue;
      }
      
      // Get bounding rectangle
      const rect = cv.boundingRect(contour);
      const aspectRatio = rect.width / rect.height;
      
      // More relaxed aspect ratio for license plates (typically between 1.5 and 7)
      if (aspectRatio >= 1.5 && aspectRatio <= 7) {
        if (area > bestArea) {
          bestArea = area;
          bestContour = i;
        }
      }
    }
    
    console.log('Best contour index:', bestContour, 'Best area:', bestArea);
    
    // If we found a potential license plate, draw it and extract the region
    if (bestContour !== -1) {
      const contour = contours.get(bestContour);
      const rect = cv.boundingRect(contour);
      
      console.log('License plate rectangle:', rect.x, rect.y, rect.width, rect.height);
      console.log('Aspect ratio:', rect.width / rect.height);
      
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
      
      binary.delete();
      roi.delete();
      
      return { 
        fullImage: canvas,
        plateRegion: roiCanvas,
        coordinates: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    } else {
      // If no plate was detected, try with the entire image as a fallback
      console.log('No license plate region detected, using full image');
      
      // Create a canvas for the result with no rectangle
      const canvas = document.createElement('canvas');
      cv.imshow(canvas, result);
      
      // Create a canvas with the entire image
      const fullImageCanvas = document.createElement('canvas');
      cv.imshow(fullImageCanvas, src);
      
      binary.delete();
      
      return { 
        fullImage: canvas,
        plateRegion: fullImageCanvas,
        coordinates: { x: 0, y: 0, width: src.cols, height: src.rows }
      };
    }
  } finally {
    // Clean up OpenCV resources
    src.delete();
    gray.delete();
    blurred.delete();
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
    
    console.log('Starting OCR on license plate region');
    
    // Get image data from canvas for debugging
    const context = plateCanvas.getContext('2d');
    if (context) {
      const imageData = context.getImageData(0, 0, plateCanvas.width, plateCanvas.height);
      console.log('OCR input image dimensions:', imageData.width, 'x', imageData.height);
    }
    
    // Recognize text in the plate region
    const { data } = await ocrWorker.recognize(plateCanvas);
    
    console.log('OCR raw result:', data.text);
    
    // Process the text to extract just the plate number
    // Remove spaces, newlines, and non-alphanumeric characters (except hyphen)
    let text = data.text.replace(/[\r\n\s]+/g, '').replace(/[^A-Z0-9-]/gi, '');
    
    // Convert to uppercase
    text = text.toUpperCase();
    
    console.log('OCR processed result:', text);
    
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