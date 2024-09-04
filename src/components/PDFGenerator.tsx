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
  const maxImages = Math.max(...lanes.map(lane => lane.images.length));

  return (
    <div className="pdf-preview">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {lanes.map((lane, laneIndex) => (
              <th key={lane.id} className="border p-2 text-center">
                Lane {laneIndex + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(maxImages + 1)].map((_, index) => (
            <tr key={index}>
              {lanes.map((lane, laneIndex) => (
                <td key={`${lane.id}-${index}`} className="border p-2">
                  {index < lane.images.length ? (
                    <div className="qr-code-container">
                      <p className="text-center mb-2">
                        {index === 0
                          ? `Lane ${laneIndex + 1} Start`
                          : lane.images[index - 1].label}
                      </p>
                      <QRCodeSVG value={lane.images[index].url} size={150} className="mx-auto" />
                    </div>
                  ) : index === lane.images.length ? (
                    <div className="qr-code-container">
                      <p className="text-center mb-2">{lane.images[index - 1].label}</p>
                      <QRCodeSVG value={`victory/${lane.id}`} size={150} className="mx-auto" />
                      <p className="text-center mt-2">Victory!</p>
                    </div>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PDFGenerator;