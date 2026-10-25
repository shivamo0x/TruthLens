import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import '@/App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </div>
    </ThemeProvider>
  );
}

export default App;