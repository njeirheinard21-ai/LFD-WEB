import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { PRICING } from '../lib/pricing';
import { useTranslation } from 'react-i18next';

interface PricingSectionProps {
  onSubscribe: (plan: 'weekly' | 'monthly' | 'yearly') => void;
}

export function PricingSection({ onSubscribe }: PricingSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-emerald-100 opacity-50 blur-[100px] mix-blend-multiply border-none pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-purple-100 opacity-50 blur-[100px] mix-blend-multiply border-none pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">{t('pricing.subtitle', 'Pricing')}</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">{t('pricing.title', 'Choose Your Plan')}</h3>
          <p className="text-xl text-gray-600">{t('pricing.desc', 'Simple, transparent pricing for unlimited access to your health journey.')}</p>
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
              <h4 className="text-2xl font-bold text-gray-900 mb-2">{t('pricing.weekly', 'Weekly')}</h4>
              <p className="text-sm text-gray-500 font-medium tracking-wide">{t('pricing.weekly_desc', 'A quick start into better health.')}</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">{PRICING.weekly.amount.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>{t('pricing.per_week', '/week')}</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {[t('pricing.feature_unlimited', 'Unlimited access to seminars'), t('pricing.feature_weekly_content', 'Weekly new content'), t('pricing.feature_cancel', 'Cancel anytime'), t('pricing.feature_hd', 'HD Video Quality')].map((feature, i) => (
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
              {t('pricing.subscribe_weekly', 'Subscribe Weekly')}
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
                {t('pricing.most_popular', 'Most Popular')}
              </div>
            </div>
            <div className="mb-8 mt-4">
              <h4 className="text-2xl font-bold text-white mb-2">{t('pricing.monthly', 'Monthly')}</h4>
              <p className="text-sm text-gray-400 font-medium tracking-wide">{t('pricing.monthly_desc', 'Perfect for consistent learning.')}</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-6xl font-black text-white tracking-tight">{PRICING.monthly.amount.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>{t('pricing.per_month', '/month')}</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {[t('pricing.feature_unlimited', 'Unlimited access to seminars'), t('pricing.feature_monthly_content', 'New content added monthly'), t('pricing.feature_cancel', 'Cancel anytime'), t('pricing.feature_hd', 'HD Video Quality')].map((feature, i) => (
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
              {t('pricing.subscribe_monthly', 'Subscribe Monthly')}
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
                {t('pricing.best_value', 'Best Value')}
              </div>
            </div>
            <div className="mb-8 mt-2">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">{t('pricing.yearly', 'Yearly')}</h4>
              <p className="text-sm text-gray-500 font-medium tracking-wide">{t('pricing.yearly_desc', 'Save more with annual billing.')}</p>
            </div>
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">{PRICING.yearly.amount.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex flex-col leading-tight"><span>XAF</span><span>{t('pricing.per_year', '/year')}</span></span>
            </div>
            <ul className="space-y-5 mb-10 flex-grow">
              {[t('pricing.feature_yearly_everything', 'Everything in Monthly'), t('pricing.feature_yearly_support', 'Priority Support'), t('pricing.feature_yearly_resources', 'Downloadable Resources'), t('pricing.feature_yearly_qa', 'Live sessions Q&A')].map((feature, i) => (
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
              {t('pricing.subscribe_yearly', 'Subscribe Yearly')}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
