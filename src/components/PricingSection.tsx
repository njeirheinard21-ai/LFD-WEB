import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';

interface PricingSectionProps {
  onSubscribe: (plan: 'weekly' | 'monthly' | 'yearly') => void;
}

export function PricingSection({ onSubscribe }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-emerald-100 opacity-50 blur-[100px] mix-blend-multiply border-none pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-purple-100 opacity-50 blur-[100px] mix-blend-multiply border-none pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Pricing</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Choose Your Plan</h3>
          <p className="text-xl text-gray-600">Simple, transparent pricing for unlimited access to your health journey.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 items-stretch max-w-6xl mx-auto">
          
          {/* Weekly Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/40 relative flex flex-col h-full hover:-translate-y-2 transition-transform duration-300 ease-out"
          >
            <div className="mb-8">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Weekly</h4>
              <p className="text-sm text-gray-500 font-medium tracking-wide">A quick start into better health.</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">3,000</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>/week</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {['Unlimited access to seminars', 'Weekly new content', 'Cancel anytime', 'HD Video Quality'].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-sm font-medium text-gray-600">
                  <div className="bg-emerald-50 p-1 rounded-full mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  </div>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onSubscribe('weekly')}
              className="w-full py-4 rounded-2xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100"
            >
              Subscribe Weekly
            </button>
          </motion.div>

          {/* Monthly Plan (Popular) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-gray-900 rounded-[2.5rem] p-8 md:p-10 border border-gray-800 shadow-2xl shadow-emerald-900/20 relative flex flex-col h-full z-10"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
                Most Popular
              </div>
            </div>
            <div className="mb-8 mt-4">
              <h4 className="text-2xl font-bold text-white mb-2">Monthly</h4>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Perfect for consistent learning.</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-6xl font-black text-white tracking-tight">10,000</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>/month</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {['Unlimited access to seminars', 'New content added monthly', 'Cancel anytime', 'HD Video Quality'].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-sm font-medium text-gray-300">
                  <div className="bg-emerald-900/50 p-1 rounded-full mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onSubscribe('monthly')}
              className="w-full py-4 rounded-2xl font-bold text-gray-900 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/30"
            >
              Subscribe Monthly
            </button>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/40 relative flex flex-col h-full hover:-translate-y-2 transition-transform duration-300 ease-out"
          >
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <div className="bg-yellow-100 text-yellow-800 border-2 border-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                Best Value
              </div>
            </div>
            <div className="mb-8 mt-2">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Yearly</h4>
              <p className="text-sm text-gray-500 font-medium tracking-wide">Save more with annual billing.</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">100k</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>/year</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {['Everything in Monthly', 'Priority Support', 'Downloadable Resources', 'Live sessions Q&A'].map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-sm font-medium text-gray-600">
                  <div className="bg-yellow-50 p-1 rounded-full mt-0.5">
                    <CheckCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  </div>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onSubscribe('yearly')}
              className="w-full py-4 rounded-2xl font-bold text-yellow-900 bg-yellow-400 hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-500/20"
            >
              Subscribe Yearly
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
