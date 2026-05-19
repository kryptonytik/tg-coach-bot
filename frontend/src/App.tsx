import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TrainerDashboard from './pages/TrainerDashboard';
import ClientList from './pages/ClientList';
import AddClient from './pages/AddClient';
import ClientProfile from './pages/ClientProfile';
import WorkoutFlow from './pages/WorkoutFlow';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrainerDashboard />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/add" element={<AddClient />} />
        <Route path="/clients/:id" element={<ClientProfile />} />
        <Route path="/workout" element={<WorkoutFlow />} />
      </Routes>
    </BrowserRouter>
  );
}
