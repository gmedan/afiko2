import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

  const handleImageUpload = async (laneIndex: number, file: File) => {
    if (!huntId) return;

    // 1. Create a reference to the storage location
    const imageRef = ref(storage, `hunts/${huntId}/images/${file.name}`);

    // 2. Upload the file to Firebase Storage
    await uploadBytes(imageRef, file);

    // 3. Get the download URL of the uploaded file
    const imageUrl = await getDownloadURL(imageRef);

    // 4. Create a new Image object with the download URL
    const newImage: Image = {
      id: `image-${Date.now()}`,
      url: imageUrl,
      label: ''
    };

    // 5. Update the local state
    const updatedLanes = [...lanes];
    updatedLanes[laneIndex].images.push(newImage);
    setLanes(updatedLanes);

    // 6. Update Firestore with the new image data
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

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !huntId) return;

    const { source, destination } = result;
    const laneIndex = parseInt(source.droppableId.split('-')[1]);
    const updatedLanes = [...lanes];
    const [reorderedItem] = updatedLanes[laneIndex].images.splice(source.index, 1);
    updatedLanes[laneIndex].images.splice(destination.index, 0, reorderedItem);

    setLanes(updatedLanes);

    // Update Firestore
    await updateDoc(doc(db, 'hunts', huntId), {
      [`lanes.${laneIndex}.images`]: updatedLanes[laneIndex].images
    });
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
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lanes.map((lane, laneIndex) => (
            <div key={lane.id} className="border p-4 rounded">
              <h2 className="text-xl font-semibold mb-4">Lane {laneIndex + 1}</h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(laneIndex, e.target.files[0])}
                className="mb-4"
              />
              <CameraUpload onCapture={(file) => handleCameraCapture(laneIndex, file)} />
              <Droppable droppableId={`lane-${laneIndex}`}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {lane.images.map((image, imageIndex) => (
                      <Draggable key={image.id} draggableId={image.id} index={imageIndex}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-4 bg-white p-2 rounded shadow"
                          >
                            <img src={image.url} alt={`Lane ${laneIndex + 1} Image ${imageIndex + 1}`} className="w-full mb-2" />
                            <input
                              type="text"
                              value={image.label}
                              onChange={(e) => handleLabelChange(laneIndex, imageIndex, e.target.value)}
                              placeholder="Enter image label"
                              className="w-full px-2 py-1 border rounded mb-2"
                            />
                            <button
                              onClick={() => handleImageRemove(laneIndex, imageIndex)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                            {showQRCodes && (
                              <div className="mt-2">
                                <QRCodeGenerator url={image.url} label={image.label} />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

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