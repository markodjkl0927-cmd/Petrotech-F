'use client';

import Image from 'next/image';

export default function DoorstepDeliverySection() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Left Content - Red Background */}
        <div className="bg-primary-600 py-16 lg:py-24 px-6 lg:px-12">
          <div className="max-w-md ml-auto lg:pr-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              Doorstep Diesel Delivery with PESO-Approved Options
            </h2>
            <p className="text-white/90 text-sm mb-6 leading-relaxed">
              Petrotech offers safe and reliable fuel & EV charging doorstep delivery through two fuel delivery mediums— designed for convenience and efficiency.
            </p>
            <p className="text-white/80 text-sm leading-relaxed">
              Businesses can choose the delivery method best suited to their needs. Want to become a Petrotech customer or partner?
            </p>
          </div>
        </div>

        {/* Right Content - Image with Info Card */}
        <div className="relative bg-gradient-to-br from-cyan-400 to-teal-500 py-16 lg:py-24 px-6 lg:px-12 flex items-center justify-center">
          {/* MDU Info Card */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-cyan-400/30 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L18 9V15C18 19.4183 14.4183 23 10 23C5.58172 23 2 19.4183 2 15V9L12 3Z" fill="url(#mduGradient)"/>
                <defs>
                  <linearGradient id="mduGradient" x1="2" y1="3" x2="18" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" stopOpacity="1"/>
                    <stop offset="1" stopColor="#F97316" stopOpacity="1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-card max-w-sm">
              <div 
                className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mb-4 p-4 flex items-center justify-center"
                style={{ backgroundImage: 'url(/assets/diesel.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
              >
              </div>
              <h3 className="text-lg font-bold text-primary-600 text-center mb-2">
                Mobile Dispensing Unit (MDUs)
              </h3>
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                Our mobile delivery service uses MDUs known for their high Dispensing speed, extended delivery reach, and operation reliability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
