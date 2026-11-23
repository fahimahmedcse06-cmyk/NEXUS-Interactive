import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

let handLandmarker: HandLandmarker | null = null

export async function initializeHandTracking() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
  )

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })

  return handLandmarker
}

export function detectHands(video: HTMLVideoElement) {
  if (!handLandmarker) return null

  return handLandmarker.detectForVideo(video, performance.now())
}
