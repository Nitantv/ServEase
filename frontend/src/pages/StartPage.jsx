import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './StartPage.css';
const ProjectName = "ServEase";

// Image URLs for the new floating icons
const broomImage = "/images/broom.jpeg";
const ironImage = "/images/iron.png";
const hammerImage = "/images/hammer.png";

const StartPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize the main "fade-up" animations
    AOS.init({ duration: 1000 });

    // This function will handle the movement of the floating images
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const img1 = document.querySelector('.floating-image-1');
      const img2 = document.querySelector('.floating-image-2');
      const img3 = document.querySelector('.floating-image-3');

      // Apply different transformations to each image for varied movement
      if (img1) img1.style.transform = `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)`;
      if (img2) img2.style.transform = `translateY(-${scrollY * 0.15}px) rotate(-${scrollY * 0.03}deg)`;
      if (img3) img3.style.transform = `translateX(${scrollY * 0.12}px) rotate(${scrollY * 0.02}deg)`;
    };

    // Add the scroll event listener when the component mounts
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component unmounts to prevent memory leaks
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    // THIS IS THE KEY: A unique wrapper for this specific page.
    <div className="start-page-wrapper">
      <header className="header">
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/signup')}>Signup</button>
      </header>

      <main className="start-container">
        <div className="section" data-aos="fade-down">
          <h1 className="main-title">Welcome to {ProjectName}</h1>
        </div>
          <div className="floating-icons">
          <img src={broomImage} alt="Broom" className="floating-image-1" />
          <img src={ironImage} alt="Iron" className="floating-image-2" />
          <img src={hammerImage} alt="Hammer" className="floating-image-3" />
      </div>
        <div className="section" data-aos="fade-up">
          <p className="subtitle">
            Finding the right professional for your home can be a challenge.
            ServEase bridges that gap, instantly connecting you with a network of skilled and vetted professionals right in your neighborhood.
            Whether you need a meticulous maid, a precise carpenter, or efficient laundry services, our platform offers a seamless booking experience.
            We've done the hard work of verifying each pro for quality and reliability, so you can book with confidence.
            Say goodbye to uncertainty and endless phone calls.
            Welcome to the future of home services — simple, dependable, and just a click away.
          </p>
        </div>

        <div className="section" data-aos="zoom-in">
          <div className="divider" />
        </div>

        <div className="section why-choose" data-aos="fade-up">
          <h2 className="section-title">Why Choose Us?</h2>
          <ul className="why-list">
            <li>Trusted local workers verified for quality and reliability.</li>
            <li>Easy and quick booking with real-time availability.</li>
            <li>Affordable and transparent pricing with no hidden fees.</li>
            <li>Wide variety of services — maids, carpenters, laundry, and more.</li>
            <li>Secure payments and customer support you can count on.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default StartPage;