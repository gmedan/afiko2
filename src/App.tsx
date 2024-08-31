import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import CreateHunt from './components/CreateHunt';
import OrganizeHunt from './components/OrganizeHunt';
import ParticipantLanding from './components/ParticipantLanding';
import ParticipantHunt from './components/ParticipantHunt';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateHunt />} />
          <Route path="/organize/:huntId" element={<OrganizeHunt />} />
          <Route path="/hunt/:laneId/landing" element={<ParticipantLanding />} />
          <Route path="/hunt/:laneId" element={<ParticipantHunt />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
