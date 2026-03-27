#!/bin/bash
# Copies MediaPipe WASM runtime + downloads pose model to public/mediapipe/
# Run via: npm run setup:mediapipe (or automatically via postinstall)

set -e

DEST="public/mediapipe"
MODEL_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"

mkdir -p "$DEST"

# Copy WASM runtime files from npm package
echo "Copying MediaPipe WASM files..."
cp node_modules/@mediapipe/tasks-vision/wasm/* "$DEST/"

# Download pose landmarker model if not already present
if [ ! -f "$DEST/pose_landmarker_lite.task" ]; then
  echo "Downloading pose_landmarker_lite model (~4MB)..."
  curl -sL "$MODEL_URL" -o "$DEST/pose_landmarker_lite.task"
  echo "Model downloaded."
else
  echo "Model already exists, skipping download."
fi

echo "MediaPipe setup complete."
