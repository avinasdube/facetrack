# Face Tracker Deployment

This project uses face-api.js models that need to be downloaded during the build process.

## Build Process
1. Install dependencies
2. Download ML models
3. Build Next.js application

## Environment Variables
- NODE_ENV=production
- PORT=10000 (Render default)

## Model Files
The application downloads the following models during build:
- tiny_face_detector_model
- face_landmark_68_model
- face_recognition_model
- face_expression_model

These files are stored in the public/models directory and served statically.
