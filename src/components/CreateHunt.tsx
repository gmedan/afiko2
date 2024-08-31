import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const CreateHunt: React.FC = () => {
  const [huntName, setHuntName] = useState('');
  const [laneCount, setLaneCount] = useState(1);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'hunts'), {
        name: huntName,
        laneCount,
        createdAt: new Date(),
      });
      navigate(`/organize/${docRef.id}`);
    } catch (error) {
      console.error('Error creating hunt:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Treasure Hunt</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="huntName" className="block mb-2">Hunt Name:</label>
          <input
            type="text"
            id="huntName"
            value={huntName}
            onChange={(e) => setHuntName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="laneCount" className="block mb-2">Number of Lanes:</label>
          <input
            type="number"
            id="laneCount"
            value={laneCount}
            onChange={(e) => setLaneCount(parseInt(e.target.value))}
            min="1"
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Create Hunt
        </button>
      </form>
    </div>
  );
};

export default CreateHunt;