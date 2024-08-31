import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import QrReader from 'react-qr-reader';

interface Image {
  id: string;
  url: string;
  label: string;
}

const ParticipantHunt: React.FC = () => {
  const { laneId } = useParams<{ laneId: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<Image[]>([]);
  const [huntName, setHuntName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [huntStarted, setHuntStarted] = useState(false);

  useEffect(() => {
    const fetchHuntData = async () => {
      if (!laneId) return;

      try {
        const laneDoc = await getDoc(doc(db, 'lanes', laneId));
        if (laneDoc.exists()) {
          const laneData = laneDoc.data();
          const huntDoc = await getDoc(doc(db, 'hunts', laneData.huntId));
          if (huntDoc.exists()) {
            const huntData = huntDoc.data();
            setHuntName(huntData.name);
            setImages(huntData.lanes.find((lane: any) => lane.id === laneId).images);
            setParticipantName(laneData.participants[laneData.participants.length - 1].name);
            setHuntStarted(huntData.started || false);
          }
        } else {
          setError('Invalid hunt');
        }
      } catch (err) {
        console.error('Error fetching hunt data:', err);
        setError('An error occurred while loading the hunt');
      }

      setLoading(false);
    };

    fetchHuntData();

    // Set up real-time listener for updates
    if (laneId) {
      const unsubscribe = onSnapshot(doc(db, 'lanes', laneId), (doc) => {
        if (doc.exists()) {
          const laneData = doc.data();
          setCurrentImageIndex(laneData.currentImageIndex || 0);
        }
      });

      return () => unsubscribe();
    }
  }, [laneId]);

  const handleScan = async (data: string | null) => {
    if (data) {
      if (data === images[currentImageIndex + 1]?.url) {
        setCurrentImageIndex(currentImageIndex + 1);
        setShowScanner(false);
        
        // Update the current image index in Firestore
        if (laneId) {
          await updateDoc(doc(db, 'lanes', laneId), {
            currentImageIndex: currentImageIndex + 1
          });
        }
      } else {
        setError('Invalid QR code. Please try again.');
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('Error scanning QR code');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Treasure Hunt: {huntName}</h1>
      <p className="mb-4">Welcome, {participantName}!</p>
      {!huntStarted ? (
        <p>Please wait for the organizer to start the hunt.</p>
      ) : currentImageIndex < images.length ? (
        <div>
          <img src={images[currentImageIndex].url} alt="Current clue" className="w-full max-w-md mb-4" />
          <p className="mb-4">Find the location in this image and scan the QR code there.</p>
          {showScanner ? (
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%', maxWidth: '300px' }}
            />
          ) : (
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Scan QR Code
            </button>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
          <p>You've completed the treasure hunt!</p>
        </div>
      )}
    </div>
  );
};

export default ParticipantHunt;