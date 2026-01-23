'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How long until we deliver your first blog post?',
    answer: 'Ready to try Stax today, after and online free store, find you all it is bite size, testing you are totally bite built time or built online to on right down, need a list to of in almost or naming.',
  },
  {
    question: 'How long until we deliver your first blog post?',
    answer: 'Our delivery times vary based on your location and order size. Typically, first-time deliveries are completed within 24-48 hours of order confirmation.',
  },
  {
    question: 'How long until we deliver your first blog post?',
    answer: 'We prioritize quick turnaround times for all our fuel delivery services, ensuring you never run out of essential fuel supplies.',
  },
  {
    question: 'How long until we deliver your first blog post?',
    answer: 'Contact our customer support team for expedited delivery options if you need fuel urgently.',
  },
  {
    question: 'How long until we deliver your first blog post?',
    answer: 'We offer flexible scheduling to accommodate your business operations and fuel requirements.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-gray-100 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-600 relative inline-block">
            Frequently Ask Questions
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent rounded-full"></span>
          </h2>
        </div>

        {/* FAQ Grid */}
        <div className="grid lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-4 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-start justify-between w-full text-left gap-4"
              >
                <span className="flex items-center gap-3">
                  <span className="text-gray-500">—</span>
                  <span className="font-medium text-sm text-gray-900">
                    {faq.question}
                  </span>
                </span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  {openIndex === index ? (
                    <Minus className="w-3 h-3 text-gray-900" />
                  ) : (
                    <Plus className="w-3 h-3 text-gray-900" />
                  )}
                </span>
              </button>
              
              {openIndex === index && (
                <div className="mt-3 pl-8 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
