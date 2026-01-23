'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const tabs = ['MDU Capabilities', 'PFC Capabilities'];
const buttons = ['Technically Advance', 'Extremely Safe', 'Automation'];

const capabilities = [
  {
    title: '100% Quantity assurance',
    description: 'Get complete confidence with every diesel delivery —our MDUs ensure accurate and verified fuel delivery every time.',
  },
  {
    title: 'Best-in-Class units',
    description: 'Our fuel delivery services use PESO-approved MDUs sourced from top global manufacturers for maximum safety.',
  },
  {
    title: 'Durable & Long-Lasting',
    description: 'Equipped with anti-rust and anti-vibration features, our MDUs are built for sustained performance in mobile fuel delivery operations.',
  },
];

export default function CapabilitiesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeButton, setActiveButton] = useState(1);

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-12">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`text-xl lg:text-2xl font-bold transition-colors duration-300 ${
                activeTab === index 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-primary-600/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Left - Buttons */}
          <div className="flex flex-col gap-4">
            {buttons.map((btn, index) => (
              <button
                key={btn}
                onClick={() => setActiveButton(index)}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 text-sm text-left ${
                  activeButton === index
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-primary-600/10'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Right - Capabilities List */}
          <div className="space-y-6">
            {capabilities.map((cap, index) => (
              <div key={index} className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-primary-600 mb-1">{cap.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
