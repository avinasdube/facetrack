"use client";

import ErrorBoundary from "./components/ErrorBoundary";
import FaceTracker from "./components/FaceTracker";

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              FaceTrack
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Record videos with real-time face detection and tracking
            </p>
          </header>

          <FaceTracker />

          <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>Built with Next.js, Face-API.js, and MediaRecorder API</p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}
