/**
 * Configuration for the application
 * In a production environment, these values should be stored securely
 * and loaded from environment variables or a secure storage service.
 */

// Helper function to safely access environment variables in any environment
const getEnvVariable = (key: string, defaultValue: string): string => {
  // Check if window is defined (browser environment)
  if (typeof window !== 'undefined') {
    // For browser environments, you can store env variables in window.__env__ object
    // or just use the default value
    return (window as any).__env__?.[key] || defaultValue;
  }
  
  // For Node.js environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

export const config = {
  // Plate Recognizer API key
  plateRecognizerApiKey: getEnvVariable('PLATE_RECOGNIZER_API_KEY', '272c606e628464bfffdc7b57c2bd41f86167e899'),
  
  // Plate recognition settings
  plateRecognition: {
    // Regions to detect plates from (leave empty for automatic detection)
    // Format: 'us,eu,au' etc.
    regions: '',
    
    // API endpoint
    apiEndpoint: 'https://api.platerecognizer.com/v1/plate-reader/'
  },
  
  // Vehicle detection settings
  vehicleDetection: {
    // Minimum confidence score for vehicle detection (0-1)
    minConfidence: 0.5,
    
    // Vehicle classes to detect
    classes: ['car', 'truck', 'bus', 'motorcycle']
  }
}; 