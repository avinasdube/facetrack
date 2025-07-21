"use client";

import * as faceapi from "face-api.js";
import { useCallback, useEffect, useRef, useState } from "react";

export default function FaceTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState([]);
  const [error, setError] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const MODEL_URL = "/models";

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

  // Initialize camera
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

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

    if (modelLoaded) {
      startVideo();
    }
  }, [modelLoaded]);

  // Face detection loop
  useEffect(() => {
    let interval;

    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && modelLoaded) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          setFaceDetected(detections.length > 0);

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          const context = canvas.getContext("2d");
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Draw face detection boxes and landmarks
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          // Draw expression labels
          resizedDetections.forEach((detection) => {
            const { x, y, width, height } = detection.detection.box;
            const expressions = detection.expressions;
            const maxExpression = Object.keys(expressions).reduce((a, b) =>
              expressions[a] > expressions[b] ? a : b
            );

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

    if (modelLoaded && !isLoading) {
      interval = setInterval(detectFace, 100); // 10 FPS for face detection
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modelLoaded, isLoading]);

  // Load saved videos from localStorage
  useEffect(() => {
    const savedVideos = JSON.parse(
      localStorage.getItem("faceTrackVideos") || "[]"
    );
    setRecordedVideos(savedVideos);
  }, []);

  const startRecording = useCallback(() => {
    if (!videoRef.current) return;

    try {
      const stream = videoRef.current.srcObject;
      const options = {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 2500000,
      };

      // Fallback for browsers that don't support vp9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString();

        const newVideo = {
          id: Date.now(),
          url,
          timestamp,
          name: `Face-Track-Recording-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}`,
        };

        const updatedVideos = [...recordedVideos, newVideo];
        setRecordedVideos(updatedVideos);

        // Save to localStorage (store metadata only, not the blob)
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

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording");
    }
  }, [recordedVideos]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const downloadVideo = (video) => {
    const a = document.createElement("a");
    a.href = video.url;
    a.download = `${video.name}.webm`;
    a.click();
  };

  const deleteVideo = (videoId) => {
    const updatedVideos = recordedVideos.filter((v) => v.id !== videoId);
    setRecordedVideos(updatedVideos);

    const videosForStorage = updatedVideos.map((v) => ({
      id: v.id,
      timestamp: v.timestamp,
      name: v.name,
    }));
    localStorage.setItem("faceTrackVideos", JSON.stringify(videosForStorage));
  };

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
      {/* video recording section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-8">
        <div className="relative">
          {/* video container */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (videoRef.current && canvasRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold bg-black bg-opacity-50 px-2 py-1 rounded">
                  RECORDING
                </span>
              </div>
            )}

            {/* Face Detection Status */}
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

          {/* Controls */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
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

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Videos saved: {recordedVideos.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recorded Videos Section */}
      {recordedVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Recorded Videos
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Your face tracking recordings are saved locally
            </p>
          </div>

          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recordedVideos.map((video) => (
                <div
                  key={video.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  <video
                    src={video.url}
                    controls
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                      {video.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(video.timestamp).toLocaleString()}
                    </p>
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
