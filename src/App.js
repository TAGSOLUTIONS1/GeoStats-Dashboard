import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import B2C from './pages/B2C';
import B2G from './pages/B2G';
import UseCases from './pages/UseCases';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import './App.css';
import Layout2 from './components/layout/Layout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Map dashboard: legacy layout without navbar/footer */}
        <Route path="/map" element={<Layout2 />} />

        {/* Marketing site with navbar/footer */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/b2c" element={<Layout><B2C /></Layout>} />
        <Route path="/b2g" element={<Layout><B2G /></Layout>} />
        <Route path="/use-cases" element={<Layout><UseCases /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/faq" element={<Layout><FAQ /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
