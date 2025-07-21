"use client";

// importing face-api.js for face detection and recognition
import * as faceapi from "face-api.js";
import { useCallback, useEffect, useRef, useState } from "react";

// the main face tracker component

export default function FaceTracker() {
  // refs for DOM elements and media handling
  const videoRef = useRef(null); // video element for camera stream
  const canvasRef = useRef(null); // canvas for face detection overlay
  const mediaRecorderRef = useRef(null); // mediaRecorder for video recording
  const recordedChunks = useRef([]); // buffer for video chunks during recording

  // state management for component functionality
  const [isLoading, setIsLoading] = useState(true); // loading state for models
  const [isRecording, setIsRecording] = useState(false); // recording state
  const [faceDetected, setFaceDetected] = useState(false); // face detection status
  const [recordedVideos, setRecordedVideos] = useState([]); // array of recorded videos
  const [error, setError] = useState(""); // error message state
  const [modelLoaded, setModelLoaded] = useState(false); // model loading completion state

  // loading all required machine learning models for face detection
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const MODEL_URL = "/models"; // path to model files in public directory

        // loading all models in parallel for better performance
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        setModelLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setError("Failed to load face detection models");
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // initializing camera stream
  useEffect(() => {
    const startVideo = async () => {
      try {
        // requesting camera access with HD resolution preferences
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 }, // preferred width
            height: { ideal: 720 }, // preferred height
            facingMode: "user", // front-facing camera
          },
          audio: true, // enable audio for video recording
        });

        // attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(
          "Failed to access camera. Please ensure camera permissions are granted."
        );
      }
    };

    // only start camera after models are loaded
    if (modelLoaded) {
      startVideo();
    }
  }, [modelLoaded]);

  // running continuous face detection on the video stream and renders
  useEffect(() => {
    let interval;

    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && modelLoaded) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // setting canvas dimensions to match video
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        try {
          // perform comprehensive face analysis
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks() // add 68-point landmarks
            .withFaceExpressions(); // add emotion recognition

          // updating face detection status for UI
          setFaceDetected(detections.length > 0);

          // resize detection results to match display dimensions
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

          // clear previous drawings
          const context = canvas.getContext("2d");
          context.clearRect(0, 0, canvas.width, canvas.height);

          // render face detection overlays
          faceapi.draw.drawDetections(canvas, resizedDetections); // Bounding boxes
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // Facial landmarks

          // draw expression labels with confidence scores
          resizedDetections.forEach((detection) => {
            const { x, y, width, height } = detection.detection.box;
            const expressions = detection.expressions;

            // find the expression with highest confidence
            const maxExpression = Object.keys(expressions).reduce((a, b) =>
              expressions[a] > expressions[b] ? a : b
            );

            // style and draw the expression label
            context.fillStyle = "#00FF00";
            context.font = "16px Arial";
            context.fillText(
              `${maxExpression}: ${(expressions[maxExpression] * 100).toFixed(
                1
              )}%`,
              x,
              y - 10
            );
          });
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }
    };

    // start detection loop only when models are loaded and not in loading state
    if (modelLoaded && !isLoading) {
      interval = setInterval(detectFace, 100); // 10 FPS detection rate
    }

    // cleanup interval on component unmount or dependency change
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modelLoaded, isLoading]);

  // loading saved videos from localStorage
  useEffect(() => {
    const savedVideos = JSON.parse(
      localStorage.getItem("faceTrackVideos") || "[]"
    );
    setRecordedVideos(savedVideos);
  }, []);

  // initiating video recording of the camera stream with face detection overlay
  const startRecording = useCallback(() => {
    if (!videoRef.current) return;

    try {
      const stream = videoRef.current.srcObject;

      // configuring recording options with high quality settings
      const options = {
        mimeType: "video/webm;codecs=vp9", // preferred codec for better compression
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      };

      // setting fallback for browsers that don't support VP9 codec
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }

      // initialize MediaRecorder with the camera stream
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      recordedChunks.current = [];

      // handling incoming video data chunks
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      // handling recording completion
      mediaRecorderRef.current.onstop = () => {
        // creating blob from recorded chunks
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString();

        // creating video metadata object
        const newVideo = {
          id: Date.now(),
          url,
          timestamp,
          name: `Face-Track-Recording-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}`,
        };

        // updating state with new video
        const updatedVideos = [...recordedVideos, newVideo];
        setRecordedVideos(updatedVideos);

        // saving metadata to localStorage (excluding blob URLs for storage efficiency)
        const videosForStorage = updatedVideos.map((v) => ({
          id: v.id,
          timestamp: v.timestamp,
          name: v.name,
        }));
        localStorage.setItem(
          "faceTrackVideos",
          JSON.stringify(videosForStorage)
        );
      };

      // starting the recording process
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording");
    }
  }, [recordedVideos]);

  // stoping the current recording session and triggering the onstop event
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // creating a download link for a recorded video and triggering the download.
  const downloadVideo = (video) => {
    const a = document.createElement("a");
    a.href = video.url;
    a.download = `${video.name}.webm`;
    a.click();
  };

  // removing a video from the recorded videos list and updates localStorage.
  const deleteVideo = (videoId) => {
    const updatedVideos = recordedVideos.filter((v) => v.id !== videoId);
    setRecordedVideos(updatedVideos);

    // updating localStorage with remaining videos
    const videosForStorage = updatedVideos.map((v) => ({
      id: v.id,
      timestamp: v.timestamp,
      name: v.name,
    }));
    localStorage.setItem("faceTrackVideos", JSON.stringify(videosForStorage));
  };

  // render loading state while models are being loaded
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Loading face detection models...
        </p>
      </div>
    );
  }

  // render error state if something went wrong
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main video recording section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-8">
        <div className="relative">
          {/* Video container with overlay canvas */}
          <div className="relative aspect-video bg-black">
            {/* Main video element for camera stream */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                // Set canvas dimensions to match video resolution
                if (videoRef.current && canvasRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                }
              }}
            />
            {/* Overlay canvas for face detection visualization */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />

            {/* Recording status indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold bg-black bg-opacity-50 px-2 py-1 rounded">
                  RECORDING
                </span>
              </div>
            )}

            {/* Face detection status indicator */}
            <div className="absolute top-4 right-4">
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  faceDetected
                    ? "bg-green-500 bg-opacity-80 text-white"
                    : "bg-yellow-500 bg-opacity-80 text-white"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    faceDetected ? "bg-white" : "bg-white animate-pulse"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {faceDetected ? "Face Detected" : "No Face Detected"}
                </span>
              </div>
            </div>
          </div>

          {/* Control panel */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                {/* Main recording toggle button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {isRecording ? "⏹ Stop Recording" : "⏺ Start Recording"}
                </button>

                {/* Face detection status text */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {faceDetected ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Ready to record
                    </span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      ⚠ Position your face in view
                    </span>
                  )}
                </div>
              </div>

              {/* Video count display */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Videos saved: {recordedVideos.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recorded videos gallery section */}
      {recordedVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Section header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Recorded Videos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Your face tracking recordings are saved locally
            </p>
          </div>

          {/* Video grid */}
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recordedVideos.map((video) => (
                <div
                  key={video.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Video preview */}
                  <video
                    src={video.url}
                    controls
                    className="w-full h-48 object-cover"
                  />
                  {/* Video metadata and controls */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                      {video.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(video.timestamp).toLocaleString()}
                    </p>
                    {/* Action buttons */}
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => downloadVideo(video)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
