// Shared camera and MediaPipe setup for every movement game.
// Video never leaves the browser: frames go straight from the camera into
// MediaPipe running on this computer.

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0';
const MODELS = {
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
};

const cache = {};

export async function getLandmarker(kind) {
  if (cache[kind]) return cache[kind];
  const vision = await import(`${VISION}/vision_bundle.mjs`);
  const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const build = (delegate) => {
    const baseOptions = { modelAssetPath: MODELS[kind], delegate };
    if (kind === 'face') return vision.FaceLandmarker.createFromOptions(files, { baseOptions, runningMode: 'VIDEO', numFaces: 1 });
    if (kind === 'pose') return vision.PoseLandmarker.createFromOptions(files, { baseOptions, runningMode: 'VIDEO', numPoses: 1 });
    return vision.HandLandmarker.createFromOptions(files, { baseOptions, runningMode: 'VIDEO', numHands: 1 });
  };
  try {
    cache[kind] = await build('GPU');
  } catch (e) {
    cache[kind] = await build('CPU');
  }
  return cache[kind];
}

// Ask for the front camera. Throws with a plain-language message on failure.
export async function openCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('This browser cannot use a camera. Please try Chrome, Edge, or Safari.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (e) {
    throw new Error('We could not use your camera. Check that it is plugged in, and choose "Allow" when the browser asks.');
  }
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function closeCamera(video, stream) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
}
