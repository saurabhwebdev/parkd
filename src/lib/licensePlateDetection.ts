import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';  // Import WebGL backend
import '@tensorflow/tfjs-backend-cpu';    // Import CPU backend as fallback
import { config } from './config';

// Holds the loaded COCO-SSD model instance
let model: cocoSsd.ObjectDetection | null = null;

/**
 * Initialize TensorFlow.js model for vehicle detection
 */
export const initDetectionModel = async () => {
  if (!model) {
    try {
      console.log('Setting up TensorFlow.js backends...');
      
      // Try to use WebGL backend first, fall back to CPU if needed
      try {
        await tf.setBackend('webgl');
        console.log('Using WebGL backend');
      } catch (error) {
        console.warn('WebGL backend failed, falling back to CPU:', error);
        await tf.setBackend('cpu');
        console.log('Using CPU backend');
      }
      
      // Set flags for better performance
      tf.env().set('WEBGL_CPU_FORWARD', false);
      tf.env().set('WEBGL_PACK', true);
      
      console.log('Loading COCO-SSD model...');
      model = await cocoSsd.load();
      console.log('COCO-SSD model loaded successfully');
      return model;
    } catch (error) {
      console.error('Error loading COCO-SSD model:', error);
      throw error;
    }
  }
  return model;
};

/**
 * Detect vehicles in an image
 * @param imgElement HTML Image or Canvas element containing the captured image
 * @returns Bounding box of the detected vehicle
 */
export const detectVehicle = async (imgElement: HTMLCanvasElement | HTMLImageElement) => {
  try {
    // Initialize the model if not already done
    const detectionModel = await initDetectionModel();
    
    // Perform object detection
    const predictions = await detectionModel.detect(imgElement);
    
    // Filter for vehicle classes using config
    const vehicleClasses = config.vehicleDetection.classes;
    const minConfidence = config.vehicleDetection.minConfidence;
    
    const vehicles = predictions.filter(prediction => 
      vehicleClasses.includes(prediction.class) && prediction.score > minConfidence
    );
    
    if (vehicles.length === 0) {
      console.log('No vehicles detected');
      return null;
    }
    
    // Get the vehicle with highest confidence
    const vehicle = vehicles.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    console.log(`Detected ${vehicle.class} with confidence ${vehicle.score}`);
    
    // Return the bounding box and class
    return {
      box: vehicle.bbox,
      class: vehicle.class,
      confidence: vehicle.score
    };
  } catch (error) {
    console.error('Error detecting vehicle:', error);
    throw error;
  }
};

/**
 * Extract the region of interest containing the potential license plate
 * @param imgElement HTML Image or Canvas element
 * @param vehicleBox Bounding box of the detected vehicle
 * @returns Canvas with the extracted region
 */
export const extractVehicleRegion = (imgElement: HTMLCanvasElement | HTMLImageElement, vehicleBox: [number, number, number, number]) => {
  // Create a canvas to extract the vehicle region
  const canvas = document.createElement('canvas');
  const [x, y, width, height] = vehicleBox;
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(imgElement, x, y, width, height, 0, 0, width, height);
  }
  
  return canvas;
};

/**
 * Send the image to Plate Recognizer API for license plate recognition
 * @param imgCanvas Canvas element containing the image
 * @returns Recognized license plate text
 */
export const recognizeLicensePlate = async (imgCanvas: HTMLCanvasElement): Promise<string> => {
  try {
    console.log('Sending image to Plate Recognizer API');
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      imgCanvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
    });
    
    // Create form data
    const formData = new FormData();
    formData.append('upload', blob, 'vehicle.jpg');
    formData.append('regions', config.plateRecognition.regions);
    
    // Send to Plate Recognizer API
    const response = await fetch(config.plateRecognition.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.plateRecognizerApiKey}`
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract plate text from response
    if (data.results && data.results.length > 0) {
      const plate = data.results[0].plate;
      console.log('License plate recognized:', plate);
      return plate;
    }
    
    console.log('No license plate found in the image');
    return '';
  } catch (error) {
    console.error('Error recognizing license plate:', error);
    return '';
  }
};

/**
 * Process an image to detect vehicles and recognize license plates
 * @param imageElement HTML Image or Canvas element containing the captured image
 * @returns License plate text or empty string if none detected
 */
export const processLicensePlate = async (imageElement: HTMLCanvasElement | HTMLImageElement): Promise<string> => {
  try {
    console.log('Starting license plate processing');
    
    // Option 1: First detect vehicle, then send that region to Plate Recognizer
    const vehicle = await detectVehicle(imageElement);
    
    if (vehicle) {
      console.log('Vehicle detected, extracting region');
      const vehicleRegion = extractVehicleRegion(imageElement, vehicle.box);
      return await recognizeLicensePlate(vehicleRegion);
    }
    
    // Option 2: If no vehicle detected or as a fallback, send the entire image
    console.log('No vehicle detected, trying with full image');
    return await recognizeLicensePlate(imageElement as HTMLCanvasElement);
  } catch (error) {
    console.error('Error processing license plate:', error);
    return '';
  }
};

/**
 * Clean up resources when no longer needed
 */
export const cleanup = async () => {
  // TensorFlow.js models don't need explicit cleanup
  model = null;
}; 