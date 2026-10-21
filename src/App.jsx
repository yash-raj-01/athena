import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const imageCaptureRef = useRef(null);

  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // 1. Fetch remaining time from Main Process
  async function getLapsedTime() {
    const currTime = await window.electronAPI.getRemainingTime();
    setTime(currTime);
  }

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      getLapsedTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  // 2. Configure Webcam
  async function getCamera() {
    const videoData = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = videoData;
    const track = videoData.getVideoTracks()[0];
    imageCaptureRef.current = new ImageCapture(track);
    setCameraReady(true);
  }

  // 3. Capture Photo & send to Node.js backend
  async function clickPhoto() {
    if (!imageCaptureRef.current) return;
    const blob = await imageCaptureRef.current.takePhoto();
    const buffer = await blob.arrayBuffer();
    await window.electronAPI.savePhoto(buffer);
  }

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      clickPhoto();
    }, 5000);
    return () => clearInterval(id);
  }, [started]);

  // 4. Kiosk Mode & Start Exam
  async function getFullscreen() {
    await window.electronAPI.setFullScreen();
  }

  async function startTest() {
    const response = await window.electronAPI.showExamRules();
    if (response === 1) { // Clicked Accept
      await window.electronAPI.startTest();
      setStarted(true);
    }
  }

  function formatTimeLeft(ms) {
    const seconds = Math.floor((ms / 1000) % 60).toString().padStart(2, "0");
    const minutes = Math.floor((ms / (1000 * 60)) % 60).toString().padStart(2, "0");
    const hours = Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return (
    <div className="page-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        className={cameraReady ? "video-preview" : "hidden-video"}
      />

      <div className="header-section">
        <h1>Athena Exam Portal</h1>
        <p>Complete the required permissions before beginning your test.</p>
      </div>

      <div className="card-container">
        <div className="permission-item">
          <div className="permission-content">
            <h3>1. Configure Camera</h3>
            <p>Your camera must be enabled for periodic proctor snapshots.</p>
            <button onClick={getCamera} className="btn btn-dark" disabled={cameraReady}>
              {cameraReady ? "Camera Active ✓" : "Enable Camera"}
            </button>
          </div>
        </div>

        <div className="divider" />

        <div className="permission-item">
          <div className="permission-content">
            <h3>2. Fullscreen Mode</h3>
            <p>Lock the application window to prevent tab switching.</p>
            <button onClick={getFullscreen} className="btn btn-blue">
              Lock Fullscreen
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button onClick={startTest} className="btn btn-primary" disabled={!cameraReady || started}>
          {started ? "Exam in Progress" : "Start Exam"}
        </button>
      </div>

      {started && (
        <div className="timer-badge">
          Time Left: <strong>{formatTimeLeft(time)}</strong>
        </div>
      )}
    </div>
  );
}

export default App;
