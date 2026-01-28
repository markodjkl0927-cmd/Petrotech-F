'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
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

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user, router]);

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

  // Don't render homepage if user is authenticated (will redirect)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 min-h-[600px] lg:min-h-[700px] flex items-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content - Text */}
            <div className="relative z-10 space-y-6 lg:space-y-8 text-center lg:text-left animate-fadeInUp">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Reliable Fuel Delivery Service</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <span className="text-yellow-400 block lg:inline">Petrotech</span>
                <span className="text-white block lg:inline lg:ml-2">Fuel Delivery</span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                Get reliable doorstep diesel fuel delivery and EV charging services. Fast, safe, and efficient fuel delivery through web dispensing units and smart fuel containers.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start animate-fadeInUp" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                <Link
                  href={isAuthenticated ? "/products" : "/login"}
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-500 ease-out shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <span>Order Fuel Now</span>
                  <svg className="ml-2 w-5 h-5 transition-transform duration-500 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/40 hover:bg-white/10 hover:border-white/60 transition-all duration-500 ease-out hover:scale-105 active:scale-95"
                >
                  <span>Find EV Charging</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6 lg:pt-8 border-t border-white/20 animate-fadeInUp" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">24/7 Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">Safe & Secure</span>
                </div>
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="relative w-full lg:w-auto flex justify-center lg:justify-end animate-fadeInUp" style={{ animationDelay: '1s', animationFillMode: 'both' }}>
              <div className="relative w-full max-w-lg lg:max-w-2xl">
                {/* Decorative gradient background */}
                <div className="absolute -inset-4 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl blur-2xl"></div>
                
                {/* Main image carousel */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 transition-transform duration-700 ease-out hover:scale-[1.02] hover:shadow-3xl">
                  <div className="w-full h-[400px] sm:h-[450px] lg:h-[500px] relative bg-gradient-to-br from-gray-100 to-gray-200">
                    {heroImages.map((image, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          index === currentHeroImage ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Fuel delivery service ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation dots */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentHeroImage(index)}
                        className={`rounded-full transition-all duration-500 ease-out ${
                          index === currentHeroImage
                            ? 'bg-white w-8 h-2'
                            : 'bg-white/50 hover:bg-white/75 w-2 h-2'
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
