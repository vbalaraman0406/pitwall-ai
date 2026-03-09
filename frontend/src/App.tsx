import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RaceDetail from './pages/RaceDetail';
import Drivers from './pages/Drivers';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/f1">
        <div className="min-h-screen bg-pitwall-bg text-pitwall-text">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/race/:year/:round" element={<RaceDetail />} />
              <Route path="/drivers/:year" element={<Drivers />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
