import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const ParticipantLanding: React.FC = () => {
  const { laneId } = useParams<{ laneId: string }>();
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState('');
  const [huntName, setHuntName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHuntData = async () => {
      if (!laneId) return;

      try {
        const laneDoc = await getDoc(doc(db, 'lanes', laneId));
        if (laneDoc.exists()) {
          const laneData = laneDoc.data();
          const huntDoc = await getDoc(doc(db, 'hunts', laneData.huntId));
          if (huntDoc.exists()) {
            setHuntName(huntDoc.data().name);
          }
        } else {
          setError('Invalid invitation link');
        }
      } catch (err) {
        console.error('Error fetching hunt data:', err);
        setError('An error occurred while loading the hunt');
      }

      setLoading(false);
    };

    fetchHuntData();
  }, [laneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laneId || !participantName.trim()) return;

    try {
      await updateDoc(doc(db, 'lanes', laneId), {
        participants: arrayUnion({
          name: participantName,
          joinedAt: new Date(),
          ready: false
        })
      });

      navigate(`/hunt/${laneId}`);
    } catch (err) {
      console.error('Error joining hunt:', err);
      setError('An error occurred while joining the hunt');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Join Treasure Hunt: {huntName}</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="participantName" className="block mb-2">Your Name:</label>
          <input
            type="text"
            id="participantName"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Join Hunt
        </button>
      </form>
    </div>
  );
};

export default ParticipantLanding;