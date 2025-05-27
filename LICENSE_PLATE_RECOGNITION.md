# License Plate Recognition System

This document provides instructions on setting up and using the license plate recognition feature in the ParkD application.

## Overview

The system uses a two-step process for license plate recognition:

1. **Vehicle Detection**: Uses TensorFlow.js and the COCO-SSD model to detect vehicles in the camera feed.
2. **License Plate Recognition**: Uses the Plate Recognizer API to identify and extract license plate text from the detected vehicle.

## Prerequisites

- TensorFlow.js packages: `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd`
- A Plate Recognizer API key (sign up at [platerecognizer.com](https://platerecognizer.com/))

## Installation

The required packages should already be installed. If not, run:

```bash
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd
```

## Configuration

There are several ways to configure the API key for Plate Recognizer:

### Option 1: Set up environment variables (for development)

For local development with frameworks like Next.js or using build tools that support environment variables:

1. Create a `.env` file in the root of your project:

```
PLATE_RECOGNIZER_API_KEY=your_api_key_here
```

2. Make sure your build process includes these environment variables.

### Option 2: Set values directly in the config file

For quick testing, you can directly modify the `src/lib/config.ts` file:

```typescript
export const config = {
  plateRecognizerApiKey: 'your_api_key_here',
  // ... other settings
};
```

### Option 3: Set up window.__env__ for browser environments

For production browser environments where process.env isn't available, you can set up a global variable:

```html
<!-- In your index.html or layout file -->
<script>
  window.__env__ = {
    PLATE_RECOGNIZER_API_KEY: 'your_api_key_here'
  };
</script>
```

## Usage

The license plate recognition system is designed to work with both images and video streams:

### Processing an Image

```typescript
import { processLicensePlate } from './lib/licensePlateDetection';

// Example with an HTML canvas or image element
const imageElement = document.getElementById('vehicleImage') as HTMLImageElement;
const licensePlate = await processLicensePlate(imageElement);
console.log('Detected license plate:', licensePlate);
```

### Processing a Video Stream

For live video processing, you need to capture frames from the video stream and process them:

```typescript
import { processLicensePlate } from './lib/licensePlateDetection';

const videoElement = document.getElementById('videoStream') as HTMLVideoElement;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match video
canvas.width = videoElement.videoWidth;
canvas.height = videoElement.videoHeight;

// Process video frame
function processFrame() {
  if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    // Draw video frame to canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Process the frame
    processLicensePlate(canvas)
      .then(licensePlate => {
        if (licensePlate) {
          console.log('Detected license plate:', licensePlate);
        }
      });
  }
  
  // Schedule next frame
  requestAnimationFrame(processFrame);
}

// Start processing
processFrame();
```

## Customization

You can customize the behavior of the license plate recognition system by modifying the settings in `src/lib/config.ts`:

### Vehicle Detection Settings

```typescript
vehicleDetection: {
  // Minimum confidence score for vehicle detection (0-1)
  minConfidence: 0.5,
  
  // Vehicle classes to detect
  classes: ['car', 'truck', 'bus', 'motorcycle']
}
```

### Plate Recognition Settings

```typescript
plateRecognition: {
  // Regions to detect plates from (leave empty for automatic detection)
  // Format: 'us,eu,au' etc.
  regions: '',
  
  // API endpoint
  apiEndpoint: 'https://api.platerecognizer.com/v1/plate-reader/'
}
```

## Troubleshooting

### Model Loading Issues

If you're experiencing issues with the TensorFlow.js model loading:

1. Make sure you have a stable internet connection when loading the model for the first time.
2. Check browser console for any specific error messages.
3. Try clearing your browser cache and reloading the application.

### API Issues

If the license plate recognition API is not working:

1. Verify your API key is correct.
2. Ensure you have sufficient API credits in your Plate Recognizer account.
3. Check if the API response contains any error messages.

## Performance Considerations

- The vehicle detection model requires significant computational resources. For optimal performance, use a device with a powerful CPU/GPU.
- To improve performance, you can:
  - Reduce the video resolution
  - Process fewer frames per second
  - Optimize the bounding box extraction process

## Privacy and Data Handling

- The system sends images to a third-party API (Plate Recognizer). Ensure this complies with your privacy policy.
- Consider implementing data retention policies for license plate information.
- Always inform users about the collection and processing of license plate data.

## License

This license plate recognition system uses components with various licenses:

- TensorFlow.js: Apache License 2.0
- COCO-SSD model: Apache License 2.0
- Plate Recognizer API: Commercial license (requires API key)

Ensure you comply with all applicable license terms when using this system. 