import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PDFGeneratorProps {
  lanes: {
    id: string;
    images: {
      id: string;
      url: string;
      label: string;
    }[];
  }[];
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ lanes }) => {
  return (
    <div className="pdf-preview">
      {lanes.map((lane, laneIndex) => (
        <div key={lane.id} className="page">
          <h2>Lane {laneIndex + 1}</h2>
          {lane.images.map((image, imageIndex) => (
            <div key={image.id} className="qr-code-container">
              <p>
                {imageIndex === 0
                  ? `Lane ${laneIndex + 1} Start`
                  : lane.images[imageIndex - 1].label}
              </p>
              <QRCodeSVG value={image.url} size={150} />
            </div>
          ))}
          <div className="qr-code-container">
            <p>{lane.images[lane.images.length - 1].label}</p>
            <QRCodeSVG value={`victory/${lane.id}`} size={150} />
            <p>Victory!</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PDFGenerator;