'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import FeaturesSection from '@/components/FeaturesSection';
import DoorstepDeliverySection from '@/components/DoorstepDeliverySection';
import CapabilitiesSection from '@/components/CapabilitiesSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  
  const heroImages = [
    '/assets/hero.jpg',
    '/assets/hero1.jpg',
    '/assets/hero2.jpg',
    '/assets/hero3.avif',
    '/assets/hero4.jpg',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);


  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400">
        

        {/* Main hero content */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 lg:pb-32">
          <div className="flex gap-12 items-center">
            {/* Left Content - Text */}
            <div className="relative z-10 space-y-6 lg:space-y-8 animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full animate-fadeIn">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Reliable Fuel Delivery Service</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                <span className="text-yellow-400">Petrotech</span>
                <br />
                <span className="text-white">Fuel Delivery</span>
              </h1>

              <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                Get reliable doorstep diesel fuel delivery and EV charging services. Fast, safe, and efficient fuel delivery through web dispensing units and smart fuel containers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                <Link
                  href={isAuthenticated ? "/products" : "/login"}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <span>Order Fuel Now</span>
                  <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span>Find EV Charging</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-6 lg:pt-8 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">24/7 Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">Safe & Secure</span>
                </div>
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="relative lg:absolute lg:right-12 lg:top-1/2 lg:-translate-y-1/2 lg:w-[48%] xl:w-[45%] animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
              {/* Petrotech Card - Positioned on image */}

              {/* Hero Image with decorative elements */}
              <div className="relative">
                {/* Decorative circle background */}
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
                
                {/* Main image carousel */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white transition-transform duration-500 hover:scale-105">
                  <div className="w-full h-[350px] sm:h-[350px] relative bg-gradient-to-br from-blue-50 to-blue-100">
                    {heroImages.map((image, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          index === currentHeroImage ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Fuel delivery truck ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="(max-width: 1024px) 100vw, 45vw"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentHeroImage(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentHeroImage
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Sections - Always visible */}
      <FeaturesSection />
      <DoorstepDeliverySection />
      <CapabilitiesSection />
      <FAQSection />

      {/* Footer - Always visible */}
      <Footer />
    </div>
  );
}
