import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RaceDetail from './pages/RaceDetail';
import Drivers from './pages/Drivers';
import Predictions from './pages/Predictions';

/**
 * @description Root application component with routing configuration.
 * Routes: / (Dashboard), /race/:year/:round (Race Detail),
 * /drivers (Driver Stats), /predictions (Predictions)
 */
export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/race/:year/:round" element={<RaceDetail />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/predictions" element={<Predictions />} />
        </Routes>
      </Layout>
    </Router>
  );
}
