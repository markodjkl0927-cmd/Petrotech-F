'use client';

import { Truck, MapPin, FileText, CreditCard, RotateCcw } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Hassle-free diesel doorstep delivery anytime',
  },
  {
    icon: MapPin,
    title: 'Real-time fuel delivery tracking',
  },
  {
    icon: FileText,
    title: 'Multiple direct schemes on online fuel delivery orders',
  },
  {
    icon: CreditCard,
    title: 'Secure digital payments',
  },
  {
    icon: RotateCcw,
    title: 'Quick refund support',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-600 relative inline-block">
            Advanced features <span className="text-gray-900">of Petrotech</span>
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white mb-4">
                <feature.icon className="w-7 h-7" />
              </div>
              <p className="text-sm text-gray-600 font-medium leading-snug max-w-[160px]">
                {feature.title}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex justify-center gap-16 lg:gap-32 mt-12">
          {features.slice(3).map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white mb-4">
                <feature.icon className="w-7 h-7" />
              </div>
              <p className="text-sm text-gray-600 font-medium leading-snug max-w-[160px]">
                {feature.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
