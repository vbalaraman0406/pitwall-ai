import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";

// Lazy-load heavy pages for faster initial bundle
const RaceDashboard = lazy(() => import("./pages/RaceDashboard"));
const DriverStats = lazy(() => import("./pages/DriverStats"));
const Constructors = lazy(() => import("./pages/Constructors"));
const Predictions = lazy(() => import("./pages/Predictions"));
const TrackMapPage = lazy(() => import("./pages/TrackMapPage"));
const Championship = lazy(() => import("./pages/Championship"));
const HeadToHead = lazy(() => import("./pages/HeadToHead"));

function PageLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid var(--f1-red)',
        borderTop: '4px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/f1">
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/race/:year/:round" element={<RaceDashboard />} />
            <Route path="/drivers" element={<DriverStats />} />
            <Route path="/constructors" element={<Constructors />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/track-map" element={<TrackMapPage />} />
            <Route path="/championship" element={<Championship />} />
            <Route path="/head-to-head" element={<HeadToHead />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
