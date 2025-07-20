// This is a helper script to download face-api.js models
// Run this once to download the required models

const https = require("https");
const fs = require("fs");
const path = require("path");

const models = [
  {
    name: "tiny_face_detector_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json",
  },
  {
    name: "tiny_face_detector_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1",
  },
  {
    name: "face_landmark_68_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json",
  },
  {
    name: "face_landmark_68_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1",
  },
  {
    name: "face_recognition_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json",
  },
  {
    name: "face_recognition_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1",
  },
  {
    name: "face_recognition_model-shard2",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2",
  },
  {
    name: "face_expression_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json",
  },
  {
    name: "face_expression_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1",
  },
];

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "public", "models", filename);
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`Downloaded: ${filename}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
  });
};

const downloadAllModels = async () => {
  console.log("Downloading face-api.js models...");

  // Ensure models directory exists
  const modelsDir = path.join(__dirname, "public", "models");
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  try {
    for (const model of models) {
      await downloadFile(model.url, model.name);
    }
    console.log("All models downloaded successfully!");
  } catch (error) {
    console.error("Error downloading models:", error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  downloadAllModels();
}

module.exports = { downloadAllModels };
