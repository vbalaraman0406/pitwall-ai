import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import RaceDetail from './pages/RaceDetail'
import Drivers from './pages/Drivers'

function App() {
  return (
    <div className="min-h-screen bg-pitwall-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/race/:year/:round" element={<RaceDetail />} />
          <Route path="/drivers/:year" element={<Drivers />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
