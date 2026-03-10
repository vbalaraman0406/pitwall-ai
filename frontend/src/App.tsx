import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RaceDashboard from "./pages/RaceDashboard";
import DriverStats from "./pages/DriverStats";
import Constructors from "./pages/Constructors";
import Predictions from "./pages/Predictions";

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
