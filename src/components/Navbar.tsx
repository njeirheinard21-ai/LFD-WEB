import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.about', 'About Us'), path: '/about' },
    { name: t('nav.products', 'Products'), path: '/products' },
    { name: t('nav.seminars', 'Seminars'), path: '/seminars' },
    { name: t('nav.contact', 'Contact'), path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group py-2 flex-shrink-0">
            <img 
              src="https://i.imgur.com/dXhMYcs.png" 
              alt="Optimal Healthcare" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-1 sm:gap-2 leading-none sm:leading-normal">
              <span className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-[#05c770]">Optimal</span>
              <span className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-[#8B5CF6]">Health Care</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#05c770]",
                  isActive(link.path) ? "text-[#05c770]" : "text-gray-700"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <>
                {user.email?.toLowerCase() === 'njeirheinard21@gmail.com' && (
                  <Link
                    to="/admin"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-[#05c770] flex items-center gap-1",
                      isActive('/admin') ? "text-[#05c770]" : "text-gray-700"
                    )}
                  >
                    {t('nav.admin', 'Admin')}
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[#05c770] flex items-center gap-1",
                    isActive('/dashboard') ? "text-[#05c770]" : "text-gray-700"
                  )}
                >
                  <UserIcon className="h-4 w-4" /> {t('nav.dashboard', 'Dashboard')}
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#05c770]",
                  isActive('/login') ? "text-[#05c770]" : "text-gray-700"
                )}
              >
                {t('nav.login', 'Login')}
              </Link>
            )}

            <LanguageSwitcher />

            <Link
              to="/contact"
              className="flex items-center gap-2 bg-[#059669] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#047857] transition-all shadow-sm hover:shadow-md active:scale-95 text-sm whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              {t('nav.book_appointment', 'Book Appointment')}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              className="p-2 -mr-2 text-gray-600 hover:text-[#05c770] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-gray-50 border border-transparent active:border-emerald-100"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {/* Mobile Language Switcher */}
              <div className="px-3 pb-4 mb-4 border-b border-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{t('nav.language', 'Language')}</span>
                <LanguageSwitcher />
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all",
                    isActive(link.path)
                      ? "bg-emerald-50 text-[#05c770]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#05c770]"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <>
                  {user.email?.toLowerCase() === 'njeirheinard21@gmail.com' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all",
                        isActive('/admin')
                          ? "bg-emerald-50 text-[#05c770]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#05c770]"
                      )}
                    >
                      {t('nav.admin', 'Admin Dashboard')}
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                      isActive('/dashboard')
                        ? "bg-emerald-50 text-[#05c770]"
                        : "text-gray-700 hover:bg-gray-50 hover:text-[#05c770]"
                    )}
                  >
                    <UserIcon className="h-5 w-5" /> {t('nav.dashboard', 'Dashboard')}
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all",
                    isActive('/login')
                      ? "bg-emerald-50 text-[#05c770]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#05c770]"
                  )}
                >
                  {t('nav.login', 'Login')}
                </Link>
              )}

              <div className="pt-4">
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-[#059669] text-white px-6 py-3 rounded-full font-medium hover:bg-[#047857] transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                  {t('nav.book_appointment', 'Book Appointment')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
