'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-primary-600 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & App Download */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-28 h-28 flex items-center justify-center relative">
                <Image
                  src="/assets/logo-bg-red.png"
                  alt="Petrotech Logo"
                  width={112}
                  height={112}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-white">Petrotech</span>
            </Link>
            <p className="text-white/70 text-xs mb-4">
              Download the app by clicking the link below
            </p>
            <div className="flex gap-2">
              <button className="bg-gray-800 px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1 hover:bg-gray-700 transition-colors">
                <span>Google Play</span>
              </button>
              <button className="bg-gray-800 px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1 hover:bg-gray-700 transition-colors">
                <span>App Store</span>
              </button>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-bold text-white mb-4">Pages</h4>
            <ul className="space-y-2">
              {['Home', 'Fuel Delivery', 'EV Charging', 'Track Delivery', 'Contact Us'].map((link) => (
                <li key={link}>
                  <Link href="/" className="text-white/70 text-sm hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Policy */}
          <div>
            <h4 className="font-bold text-white mb-4">Terms & Policy</h4>
            <ul className="space-y-2">
              {['Site to Terms & Conditions', 'Privacy Policy', 'Help Center'].map((link) => (
                <li key={link}>
                  <Link href="/" className="text-white/70 text-sm hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(040) 951-800</span>
              </li>
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>marketing@pg.gmail.com</span>
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>3872 Walnut Hill Rd, Dallas, Texas 85400</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold text-white mb-4">Social media</h4>
            <div className="flex gap-3">
              {['f', 'y', 'in', 'ig'].map((social) => (
                <button
                  key={social}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white text-xs hover:bg-white/20 transition-colors"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <p className="text-black/70 text-xs">
            © {new Date().getFullYear()} Petrotech. All rights reserved.
          </p>
          <p className="text-black/70 text-xs">
            Site best viewed in Microsoft Edge | Chrome 40+ | Firefox 35+
          </p>
        </div>
      </div>
    </footer>
  );
}
