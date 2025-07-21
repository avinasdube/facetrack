# FaceTrack

A real-time face detection and video recording application built with **Next.js** and **Face-API.js**.

## 🎯 Features

- **Real-time Face Detection**: Uses Face-API.js for accurate face tracking with facial landmarks and expressions
- **Video Recording**: Records video with face tracking overlays using MediaRecorder API
- **Local Storage**: Saves recorded videos locally in the browser
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Expression Analysis**: Displays real-time facial expression recognition
- **Face Landmarks**: Shows detailed facial landmark detection
- **Recording Management**: Download, preview, and delete recorded videos

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download face detection models** (already done):
   ```bash
   node download-models.js
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📱 How to Use

1. **Grant Camera Permission**: Allow access to your camera when prompted
2. **Position Your Face**: Make sure your face is visible in the video feed
3. **Start Recording**: Click the "Start Recording" button when ready
4. **Face Tracking**: Watch the real-time face detection with landmarks and expressions
5. **Stop Recording**: Click "Stop Recording" to finish
6. **Manage Videos**: View, download, or delete your recordings

## 🛠 Technical Stack

- **Frontend Framework**: Next.js 15.4.2
- **Face Detection**: Face-API.js 0.22.2
- **Styling**: Tailwind CSS
- **Video Recording**: MediaRecorder API
- **Storage**: Browser localStorage
- **Language**: JavaScript/React

## 📐 Architecture

### Core Components

1. **FaceTracker.js**: Main component handling face detection and video recording
2. **Face Detection**: Real-time face tracking using TinyFaceDetector model
3. **Video Recording**: MediaRecorder API integration with face tracking overlay
4. **Storage Management**: Local video storage and management system

### Face Detection Models

The app uses these Face-API.js models:
- `TinyFaceDetector`: Lightweight face detection
- `FaceLandmark68Net`: 68-point facial landmark detection
- `FaceRecognitionNet`: Face recognition features
- `FaceExpressionNet`: Emotion/expression analysis

## 🎨 Features in Detail

### Real-time Face Tracking
- Detects faces at 10 FPS for smooth performance
- Draws bounding boxes around detected faces
- Shows 68 facial landmarks
- Displays dominant facial expression with confidence percentage

### Video Recording
- Records in WebM format with VP9 codec (fallback to WebM)
- Includes face tracking overlays in the recording
- Visual recording indicator with pulsing red dot
- High-quality video recording (2.5 Mbps bitrate)

### User Interface
- Clean, modern design with Tailwind CSS
- Responsive layout for mobile and desktop
- Dark mode support
- Loading states and error handling
- Real-time face detection status indicator

### Video Management
- Automatic local storage of recordings
- Video preview thumbnails
- Download functionality for recorded videos
- Delete option for storage management
- Timestamp and naming for recordings

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen orientations

## 🔒 Privacy & Security

- All processing happens locally in the browser
- No data is sent to external servers
- Face detection models are loaded locally
- Videos are stored only in browser localStorage
- Camera access is only used for real-time processing

## 🎯 Use Cases

- **Security Applications**: Face recognition and monitoring
- **Entertainment**: Fun face tracking effects
- **Education**: Learning about computer vision
- **Development**: Testing face detection algorithms
- **Content Creation**: Recording videos with face tracking

## 📊 Performance

- **Face Detection**: ~10 FPS on modern devices
- **Model Loading**: ~2-3 seconds initial load
- **Memory Usage**: Optimized for continuous operation
- **Battery**: Efficient processing for mobile devices

## 🐛 Troubleshooting

**Camera not working?**
- Check browser permissions
- Ensure HTTPS connection for camera access
- Try refreshing the page

**Face not detected?**
- Ensure good lighting
- Position face clearly in view
- Make sure face is not obscured

**Models not loading?**
- Check internet connection during first load
- Verify models are in `/public/models/` directory

## 🚀 Deployment

For production deployment:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Deploy to Vercel/Netlify:**
   - Connect your repository
   - Deploy with default Next.js settings

## 📈 Future Enhancements

- Cloud storage integration
- Multiple face tracking
- Real-time filters and effects
- Video editing capabilities
- Export to different formats
- Social sharing features

## 📄 License

This project is open source and available under the MIT License.

---

**Built for the Next.js Coding Challenge - Face Tracking Application**

