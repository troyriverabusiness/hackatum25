import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Partners from './pages/Partners';
import Events from './pages/Events';
import Students from './pages/Students';

// New Students section with tabs
import StudentsLayout from './pages/students/StudentsLayout';
import ForYou from './pages/students/ForYou';
import EventsPage from './pages/students/EventsPage';
import HackathonsPage from './pages/students/HackathonsPage';
import ScholarshipsPage from './pages/students/ScholarshipsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/events" element={<Events />} />
        
        {/* Old students route - keep for backwards compatibility */}
        <Route path="/students-old" element={<Students />} />
        
        {/* New students section with tabs */}
        <Route path="/students" element={<StudentsLayout />}>
          <Route index element={<Navigate to="/students/for-you" replace />} />
          <Route path="for-you" element={<ForYou />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="hackathons" element={<HackathonsPage />} />
          <Route path="scholarships" element={<ScholarshipsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

