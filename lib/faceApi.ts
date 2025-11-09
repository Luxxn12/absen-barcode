"use client";

import * as faceapi from "face-api.js";

const MODEL_BASES = [
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model",
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
];

let modelsLoaded = false;

async function loadFromBase(baseUrl: string) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
  ]);
}

export async function loadFaceApiModels() {
  if (modelsLoaded) {
    return faceapi;
  }
  let lastError: unknown = null;
  for (const base of MODEL_BASES) {
    try {
      await loadFromBase(base);
      modelsLoaded = true;
      return faceapi;
    } catch (error) {
      lastError = error;
      console.warn(`[face-api] gagal memuat model dari ${base}`, error);
    }
  }
  throw lastError ?? new Error("Gagal memuat model face-api.js");
}

export { faceapi };
