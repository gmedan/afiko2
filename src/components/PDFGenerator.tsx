import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
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
  const [qrCodes, setQrCodes] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    const generateQRCodes = async () => {
      const codes: { [key: string]: string } = {};
      for (const lane of lanes) {
        for (const image of lane.images) {
          codes[image.url] = await QRCode.toDataURL(image.url);
        }
        codes[`victory/${lane.id}`] = await QRCode.toDataURL(`victory/${lane.id}`);
      }
      setQrCodes(codes);
    };

    generateQRCodes();
  }, [lanes]);

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
                  {qrCodes[image.url] && (
                    <PDFImage src={qrCodes[image.url]} style={styles.qrCode} />
                  )}
                </View>
              ))}
              <View>
                <Text style={styles.label}>{lane.images[lane.images.length - 1].label}</Text>
                {qrCodes[`victory/${lane.id}`] && (
                  <PDFImage src={qrCodes[`victory/${lane.id}`]} style={styles.qrCode} />
                )}
                <Text style={styles.label}>Victory!</Text>
              </View>
            </View>
          </Page>
        ))}
      </Document>
    </PDFViewer>
  );
};

export default PDFGenerator;