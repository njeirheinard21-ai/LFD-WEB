import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {ArrowRight, Clock, PhoneCall, Star, Calendar, Phone } from 'lucide-react';
import { products } from '../data/products';
import { PricingSection } from '../components/PricingSection';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative w-full min-h-[100vh] lg:min-h-[800px] flex items-center pt-24 pb-32 lg:pb-40">
        {/* Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://i.imgur.com/01y4Sdh.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#061732e6] to-[#0617324d] backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-[700px]"
          >
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-[#00D084] tracking-tight leading-[1.1] mb-6 drop-shadow-md">
              {t('home.hero_title', 'For You & Your Family')}
            </h1>
            <p className="text-white font-medium text-lg md:text-xl leading-relaxed max-w-[500px] mb-10 drop-shadow-sm">
              {t('home.hero_subtitle', 'Experience world-class medical care with our team of expert specialists. We combine compassionate care with cutting-edge technology to ensure your optimal health.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/contact" 
                className="inline-flex justify-center items-center gap-2 bg-[#059669] text-white px-8 py-4 rounded-full font-bold hover:bg-[#047857] transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] w-full sm:w-auto min-h-[44px]"
              >
                <Calendar className="h-5 w-5" />
                {t('home.book_appointment', 'Book Appointment')}
              </Link>
              <Link 
                to="/products" 
                className="inline-flex justify-center items-center gap-2 bg-transparent border border-white/30 text-white px-8 py-4 rounded-full font-bold hover:scale-105 hover:border-white transition-all w-full sm:w-auto min-h-[44px]"
              >
                {t('home.explore_products', 'Explore Products')} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Information Cards */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 lg:-mt-32 mb-16 lg:mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#F8F9FA] p-[40px] rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
              >
                <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-[#059669]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('home.card1_title', 'Online Appointment')}</h3>
                <p className="text-gray-600 text-lg">{t('home.card1_desc', 'Schedule your visit with our specialists easily')}</p>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#F8F9FA] p-[40px] rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-t-4 border-[#8B5CF6]"
              >
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6 text-[#8B5CF6]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('home.card2_title', 'Working Hours')}</h3>
                <div className="flex flex-col gap-2 text-gray-600 font-medium text-lg mt-4">
                  <div className="flex justify-between items-center">
                    <span>{t('home.wed_sat', 'Wed - Sat')}</span>
                    <span className="text-gray-900 font-bold">{t('home.hours', '6:00 AM - 6:00 PM')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-red-500">
                    <span>{t('home.sun_tue', 'Sun - Tue')}</span>
                    <span>{t('home.closed', 'Closed')}</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#059669] p-[40px] rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] text-white"
              >
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{t('home.card3_title', 'Emergency Cases')}</h3>
                <p className="text-emerald-50 text-lg">{t('home.card3_desc', 'Our emergency department is open 24/7 to handle critical situations.')}</p>
              </motion.div>
            </div>
      </div>

      {/* Stats Section */}
      <section className="py-12 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { label: t('home.stat1', 'Years Experience'), value: '25+' },
              { label: t('home.stat2', 'Medical Specialists'), value: '150+' },
              { label: t('home.stat3', 'Happy Patients'), value: '50k+' },
              { label: t('home.stat4', 'Hospital Rooms'), value: '300+' },
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <div className="text-4xl font-extrabold text-white mb-2">{stat.value}</div>
                <div className="text-emerald-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.products_title', 'Premium Healthcare Products')}</h2>
            <p className="text-lg text-gray-600">{t('home.products_desc', 'Discover our curated selection of high-quality medical supplies and wellness products designed for your optimal health.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                    <span className="text-emerald-600 font-bold text-sm">{product.price}</span>
                  </div>
                  <p className="text-gray-600 mb-6 line-clamp-2">{product.description}</p>
                  <Link to={`/products/${product.id}`} className="w-full justify-center bg-white text-emerald-600 border border-emerald-600 px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all">
                    {t('home.view_details', 'View Details')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/products" className="inline-flex items-center gap-2 text-purple-700 font-semibold hover:text-purple-800">
              {t('home.browse_all', 'Browse all products')} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="bg-gray-900 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-purple-900 rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 text-purple-800/50">
              <PhoneCall className="w-64 h-64" />
            </div>
            <div className="relative z-10 max-w-2xl text-center lg:text-left">
              <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold text-white mb-4">{t('home.cta_title', 'Need Emergency Medical Help?')}</h2>
              <p className="text-purple-200 text-lg mb-0">{t('home.cta_desc', 'Our emergency department is open 24/7. Don\'t hesitate to call us immediately for urgent medical assistance.')}</p>
            </div>
            <div className="relative z-10 flex-shrink-0 w-full lg:w-auto">
              <a href="tel:+237674766946" className="flex justify-center items-center gap-3 bg-white text-purple-900 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-colors shadow-xl w-full lg:w-auto min-h-[44px]">
                <PhoneCall className="h-6 w-6" />
                +237 674 766 946
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <PricingSection onSubscribe={() => navigate('/seminars')} />

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.testimonials_title', 'What Our Patients Say')}</h2>
            <p className="text-lg text-gray-600">{t('home.testimonials_desc', 'Read about the experiences of our patients and their journey to better health with Optimal Healthcare.')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', text: t('home.test1', 'The care I received at Optimal Healthcare was outstanding. The doctors were attentive and the staff made me feel comfortable throughout my treatment.') },
              { name: 'Michael Chen', text: t('home.test2', 'I highly recommend their cardiology department. Dr. Smith took the time to explain everything clearly and put my mind at ease.') },
              { name: 'Emily Davis', text: t('home.test3', 'Booking an appointment was seamless, and I barely had to wait when I arrived. A truly professional and efficient hospital.') }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 italic mb-6">"{testimonial.text}"</p>
                <div className="font-semibold text-gray-900">- {testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Find Us / Map Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.find_us_title', 'Find Us')}</h2>
            <p className="text-lg text-gray-600">{t('home.find_us_desc', 'Visit Optimal Healthcare at our location for quality medical care.')}</p>
          </div>
          <div className="w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-gray-200">
            <iframe 
              src="https://maps.google.com/maps?q=1st%20Mega%20Center%20for%20Optimal%20Healthcare%20By%20LFD%20service&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Optimal Healthcare Location"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
