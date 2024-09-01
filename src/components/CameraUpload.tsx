import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';

interface CameraUploadProps {
  onCapture: (imageFile: File) => void;
}

const CameraUpload: React.FC<CameraUploadProps> = ({ onCapture }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const webcamRef = useRef<Webcam>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCapture = (seconds: number) => {
    setIsCapturing(true);
    setCountdown(seconds);

    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }

    captureTimeoutRef.current = setTimeout(() => {
      captureImage();
    }, seconds * 1000);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        fetch(imageSrc)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          });
      }
    }
    setIsCapturing(false);
  };

  return (
    <div className="mb-4">
      {isCapturing ? (
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full"
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-white bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center">
            {countdown}
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => startCapture(3)}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            3s Timer
          </button>
          <button
            onClick={() => startCapture(5)}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            5s Timer
          </button>
          <button
            onClick={() => startCapture(10)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            10s Timer
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraUpload;