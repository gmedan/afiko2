import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import CameraUpload from './CameraUpload';
import QRCodeGenerator from './QRCodeGenerator';
import PDFGenerator from './PDFGenerator';
// import { v4 as uuidv4 } from 'uuid';

interface Lane {
  id: string;
  images: Image[];
}

interface Image {
  id: string;
  url: string;
  label: string;
}

interface Participant {
  name: string;
  currentImageIndex: number;
  ready: boolean;
}

const OrganizeHunt: React.FC = () => {
  const { huntId } = useParams<{ huntId: string }>();
  const [huntName, setHuntName] = useState('');
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [invitationLinks, setInvitationLinks] = useState<string[]>([]);
  const [participants, setParticipants] = useState<{ [laneId: string]: Participant[] }>({});
  const [huntStarted, setHuntStarted] = useState(false);
  const [activeLaneIndex, setActiveLaneIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHuntData = async () => {
      if (!huntId) return;

      const huntDoc = await getDoc(doc(db, 'hunts', huntId));
      if (huntDoc.exists()) {
        const huntData = huntDoc.data();
        setHuntName(huntData.name);
        setLanes(Array(huntData.laneCount).fill(null).map((_, index) => ({
          id: `lane-${index + 1}`,
          images: []
        })));
      }
      setLoading(false);
    };

    fetchHuntData();

    // Add this to generate invitation links when lanes are loaded
    const links = Array(lanes.length).fill(null).map(() => `${window.location.origin}/hunt/${uuidv4()}/landing`);
    setInvitationLinks(links);

    // Set up real-time listener for participants
    if (huntId) {
      const unsubscribe = onSnapshot(collection(db, 'lanes'), (snapshot) => {
        const updatedParticipants: { [laneId: string]: Participant[] } = {};
        snapshot.docs.forEach((doc) => {
          const laneData = doc.data();
          if (laneData.huntId === huntId) {
            updatedParticipants[doc.id] = laneData.participants || [];
          }
        });
        setParticipants(updatedParticipants);
      });

      return () => unsubscribe();
    }
  }, [huntId]);

  const handleImageUpload = async (laneIndex: number, file: File, insertIndex?: number) => {
    if (!huntId) return;

    const imageRef = ref(storage, `hunts/${huntId}/images/${file.name}`);
    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);

    const newImage: Image = {
      id: `image-${Date.now()}`,
      url: imageUrl,
      label: ''
    };

    const updatedLanes = [...lanes];
    if (insertIndex !== undefined) {
      updatedLanes[laneIndex].images.splice(insertIndex + 1, 0, newImage);
    } else {
      updatedLanes[laneIndex].images.push(newImage);
    }
    setLanes(updatedLanes);

    await updateDoc(doc(db, 'hunts', huntId), {
      [`lanes.${laneIndex}.images`]: updatedLanes[laneIndex].images
    });

    // Clear the file input after successful upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moveImage = async (laneIndex: number, fromIndex: number, toIndex: number) => {
    if (!huntId) return;

    const updatedLanes = [...lanes];
    const [movedImage] = updatedLanes[laneIndex].images.splice(fromIndex, 1);
    updatedLanes[laneIndex].images.splice(toIndex, 0, movedImage);
    setLanes(updatedLanes);

    await updateDoc(doc(db, 'hunts', huntId), {
      [`lanes.${laneIndex}.images`]: updatedLanes[laneIndex].images
    });
  };

  const handleLabelChange = async (laneIndex: number, imageIndex: number, newLabel: string) => {
    if (!huntId) return;

    const updatedLanes = [...lanes];
    updatedLanes[laneIndex].images[imageIndex].label = newLabel;
    setLanes(updatedLanes);

    await updateDoc(doc(db, 'hunts', huntId), {
      [`lanes.${laneIndex}.images.${imageIndex}.label`]: newLabel
    });
  };

  const handleImageRemove = async (laneIndex: number, imageIndex: number) => {
    if (!huntId) return;

    const updatedLanes = [...lanes];
    const removedImage = updatedLanes[laneIndex].images.splice(imageIndex, 1)[0];

    setLanes(updatedLanes);

    // Delete the image from Firebase Storage
    const imageRef = ref(storage, removedImage.url);
    await deleteObject(imageRef);

    // Update Firestore
    await updateDoc(doc(db, 'hunts', huntId), {
      [`lanes.${laneIndex}.images`]: updatedLanes[laneIndex].images
    });
  };

  const handleCameraCapture = async (laneIndex: number, file: File) => {
    await handleImageUpload(laneIndex, file);
  };

  const copyInvitationLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard!');
  };

  const startHunt = async () => {
    if (!huntId) return;

    await updateDoc(doc(db, 'hunts', huntId), {
      started: true,
      startTime: new Date(),
    });
    setHuntStarted(true);
  };

  const handleTabChange = (index: number) => {
    setActiveLaneIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderControlPanel = () => (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Control Panel</h2>
      {!huntStarted ? (
        <button
          onClick={startHunt}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Start Hunt
        </button>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-2">Participant Progress</h3>
          {Object.entries(participants).map(([laneId, laneParticipants]) => (
            <div key={laneId} className="mb-4">
              <h4 className="text-lg font-medium">Lane {lanes.findIndex((lane) => lane.id === laneId) + 1}</h4>
              {laneParticipants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{participant.name}</span>
                  <span>
                    Progress: {participant.currentImageIndex} / {lanes.find((lane) => lane.id === laneId)?.images.length}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Organize Hunt: {huntName}</h1>
      <div className="mb-4">
        <button
          onClick={() => setShowQRCodes(!showQRCodes)}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          {showQRCodes ? 'Hide QR Codes' : 'Show QR Codes'}
        </button>
        <button
          onClick={() => setShowPDF(!showPDF)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {showPDF ? 'Hide PDF' : 'Generate PDF'}
        </button>
      </div>
      {showPDF && <PDFGenerator lanes={lanes} />}

      {/* Tabs for lanes */}
      <div className="mb-4">
        {lanes.map((lane, index) => (
          <button
            key={lane.id}
            onClick={() => handleTabChange(index)}
            className={`px-4 py-2 mr-2 ${
              activeLaneIndex === index
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Lane {index + 1}
          </button>
        ))}
      </div>

      {/* Active lane content */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Lane {activeLaneIndex + 1}</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleImageUpload(activeLaneIndex, e.target.files[0])}
          className="mb-4"
        />
        <CameraUpload onCapture={(file) => handleCameraCapture(activeLaneIndex, file)} />
        
        {lanes[activeLaneIndex].images.map((image, imageIndex) => (
          <div key={image.id} className="mb-4 bg-white p-2 rounded shadow">
            <img src={image.url} alt={`Lane ${activeLaneIndex + 1} Image ${imageIndex + 1}`} className="w-full mb-2" />
            <input
              type="text"
              value={image.label}
              onChange={(e) => handleLabelChange(activeLaneIndex, imageIndex, e.target.value)}
              placeholder="Enter image label"
              className="w-full px-2 py-1 border rounded mb-2"
            />
            <div className="flex justify-between">
              <button
                onClick={() => handleImageRemove(activeLaneIndex, imageIndex)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
              <div>
                <button
                  onClick={() => moveImage(activeLaneIndex, imageIndex, imageIndex - 1)}
                  disabled={imageIndex === 0}
                  className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 disabled:opacity-50 mr-2"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveImage(activeLaneIndex, imageIndex, imageIndex + 1)}
                  disabled={imageIndex === lanes[activeLaneIndex].images.length - 1}
                  className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  ↓
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(activeLaneIndex, file, imageIndex);
                };
                input.click();
              }}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 mt-2"
            >
              Add Image Below
            </button>
            {showQRCodes && (
              <div className="mt-2">
                <QRCodeGenerator url={image.url} label={image.label} />
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Invitation Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invitationLinks.map((link, index) => (
          <div key={index} className="border p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Lane {index + 1}</h3>
            <p className="mb-2 truncate">{link}</p>
            <button
              onClick={() => copyInvitationLink(link)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Copy Link
            </button>
          </div>
        ))}
      </div>

      {renderControlPanel()}
    </div>
  );
};

export default OrganizeHunt;