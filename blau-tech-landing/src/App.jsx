import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Partners from './pages/Partners';
import Events from './pages/Events';
import Students from './pages/Students';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/events" element={<Events />} />
        <Route path="/students" element={<Students />} />
      </Routes>
    </Router>
  );
}

export default App;

