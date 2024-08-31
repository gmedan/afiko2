import React from 'react';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
  url: string;
  label: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, label }) => {
  return (
    <div className="flex flex-col items-center">
      <QRCode value={url} size={128} />
      <p className="mt-2 text-center">{label}</p>
    </div>
  );
};

export default QRCodeGenerator;