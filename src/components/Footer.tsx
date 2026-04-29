import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 group mb-6">
              <div className="bg-white p-2 rounded-xl transition-transform group-hover:scale-105">
                <img 
                  src="https://i.imgur.com/dXhMYcs.png" 
                  alt="Optimal Healthcare" 
                  className="h-10 w-10 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight font-sans">
                <span className="text-[#05c770]">Optimal</span> <span className="text-[#8B5CF6]">Health Care</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('footer.brand_desc', 'Providing world-class healthcare with compassion and excellence. Your health is our top priority.')}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">{t('footer.quick_links', 'Quick Links')}</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="hover:text-[#05c770] transition-colors">{t('footer.about_us', 'About Us')}</Link></li>
              <li><Link to="/products" className="hover:text-[#05c770] transition-colors">{t('footer.products', 'Products')}</Link></li>
              <li><Link to="/seminars" className="hover:text-[#05c770] transition-colors">{t('footer.seminars', 'Seminars')}</Link></li>
              <li><Link to="/contact" className="hover:text-[#05c770] transition-colors">{t('footer.book_appointment', 'Book Appointment')}</Link></li>
              <li><Link to="/contact" className="hover:text-[#05c770] transition-colors">{t('footer.contact_us', 'Contact Us')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">{t('footer.contact_us', 'Contact Us')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-1" />
                <span>{t('footer.location', '1st Mega Center for Optimal Healthcare By LFD service')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span>+237 653 120 158</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span>info.lfdservice@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {t('footer.copyright', '&copy; {{year}} Optimal Healthcare. All rights reserved.', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">{t('footer.privacy', 'Privacy Policy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.terms', 'Terms of Service')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
