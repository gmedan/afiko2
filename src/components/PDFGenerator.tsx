import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import QRCode from 'qrcode';

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  qrCode: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    marginBottom: 5,
  },
});

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ lanes }) => {
  const generateQRCode = async (url: string) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(url);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  return (
    <PDFViewer width="100%" height={600}>
      <Document>
        {lanes.map((lane, laneIndex) => (
          <Page key={lane.id} size="A4" style={styles.page}>
            <View style={styles.section}>
              <Text style={styles.title}>Lane {laneIndex + 1}</Text>
              {lane.images.map((image, imageIndex) => (
                <View key={image.id}>
                  <Text style={styles.label}>
                    {imageIndex === 0
                      ? `Lane ${laneIndex + 1} Start`
                      : lane.images[imageIndex - 1].label}
                  </Text>
                  <PDFQRCode url={image.url} />
                </View>
              ))}
              <View>
                <Text style={styles.label}>{lane.images[lane.images.length - 1].label}</Text>
                <PDFQRCode url={`victory/${lane.id}`} />
                <Text style={styles.label}>Victory!</Text>
              </View>
            </View>
          </Page>
        ))}
      </Document>
    </PDFViewer>
  );
};

const PDFQRCode: React.FC<{ url: string }> = ({ url }) => {
  const [qrCodeDataURL, setQRCodeDataURL] = React.useState('');

  React.useEffect(() => {
    generateQRCode(url).then(setQRCodeDataURL);
  }, [url]);

  return <Image style={styles.qrCode} src={qrCodeDataURL} />;
};

export default PDFGenerator;