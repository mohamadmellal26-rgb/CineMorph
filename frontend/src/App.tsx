import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './component/Header';
import HeroSection from './component/HeroSection';
import FeaturesSection from './component/FeaturesSection';
import TestimonialsSection from './component/TestimonialsSection';
import CTASection from './component/CTASection';
import Footer from './component/Footer';
import { Login } from './component/login'; // تأكد من مسار ملف الـ Login الصحيح لديك

import Dashboard from './component/Dashboard';

import Editor from './component/editor/editor';

// صفحة الرئيسية للموقع (تجمع المكونات التي ذكرتها)
const Home = () => {
  return (
    <>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* الصفحة الرئيسية */}
        <Route path="/" element={<Home />} />

        <Route path='/Dashboard' element={<Dashboard />} />

        <Route path="/editor" element={<Editor />} />
        
        {/* صفحة تسجيل الدخول في المسار /login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;