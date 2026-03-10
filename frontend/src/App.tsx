import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RaceDashboard from "./pages/RaceDashboard";
import DriverStats from "./pages/DriverStats";
import Constructors from "./pages/Constructors";
import Predictions from "./pages/Predictions";
import TrackMapPage from "./pages/TrackMapPage";
import Championship from "./pages/Championship";
import HeadToHead from "./pages/HeadToHead";

function App() {
  return (
    <BrowserRouter basename="/f1">
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}

export default App;

