import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { Banners } from './components/Banners';
import ProfilePicker from './pages/ProfilePicker';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Session from './pages/Session';
import Result from './pages/Result';
import Progress from './pages/Progress';
import Buzzer from './pages/Buzzer';
import PinGate, { ParentGuard } from './pages/PinGate';
import ParentSettings from './pages/ParentSettings';
import QuestionEditor from './pages/QuestionEditor';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 text-stone-900">
          <Banners />
          <Routes>
            <Route path="/" element={<ProfilePicker />} />
            <Route path="/beranda" element={<Home />} />
            <Route path="/mulai/:mode" element={<Setup />} />
            <Route path="/sesi" element={<Session />} />
            <Route path="/hasil" element={<Result />} />
            <Route path="/progres" element={<Progress />} />
            <Route path="/buzzer" element={<Buzzer />} />
            <Route path="/orangtua" element={<PinGate />} />
            <Route path="/orangtua/pengaturan" element={<ParentGuard><ParentSettings /></ParentGuard>} />
            <Route path="/orangtua/soal/:id" element={<ParentGuard><QuestionEditor /></ParentGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}
