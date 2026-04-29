import { CheckCircle2, Target, Eye, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Page Header */}
      <div className="bg-purple-900 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('about.title', 'About Optimal Healthcare')}</h1>
        <p className="text-purple-200 text-lg max-w-2xl mx-auto px-4">
          {t('about.subtitle', 'Dedicated to providing exceptional medical care and improving the health of our community since 1998.')}
        </p>
      </div>

      {/* Overview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.legacy_title', 'A Legacy of Excellence in Healthcare')}</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t('about.legacy_p1', 'Optimal Healthcare is a premier medical institution committed to delivering world-class healthcare services. With state-of-the-art facilities and a team of highly skilled medical professionals, we provide comprehensive care across a wide range of specialties.')}
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('about.legacy_p2', 'Our patient-centric approach ensures that every individual receives personalized treatment plans tailored to their specific needs, fostering a healing environment that prioritizes comfort and well-being.')}
              </p>
              <ul className="space-y-4">
                {[
                  t('about.list_1', 'Advanced Medical Technology'),
                  t('about.list_2', 'Award-winning Doctors'),
                  t('about.list_3', '24/7 Emergency Care'),
                  t('about.list_4', 'Patient-First Philosophy')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://i.imgur.com/r0N9aBe.png" 
                alt="Optimal Healthcare Excellence" 
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-8 -left-8 bg-emerald-600 text-white p-8 rounded-2xl shadow-lg hidden md:block">
                <div className="text-4xl font-bold mb-1">25+</div>
                <div className="text-emerald-100 font-medium">{t('about.years', 'Years of Excellence')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('about.mission', 'Our Mission')}</h3>
              <p className="text-gray-600">{t('about.mission_desc', 'To provide compassionate, accessible, high-quality, and cost-effective healthcare to the community we serve.')}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('about.vision', 'Our Vision')}</h3>
              <p className="text-gray-600">{t('about.vision_desc', 'To be the healthcare provider of choice, recognized for clinical excellence and unparalleled patient experience.')}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('about.values', 'Our Values')}</h3>
              <p className="text-gray-600">{t('about.values_desc', 'Integrity, Compassion, Accountability, Respect, and Excellence in everything we do.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.leadership', 'Our Leadership')}</h2>
            <p className="text-lg text-gray-600">{t('about.leadership_desc', 'Guided by experienced medical professionals dedicated to advancing healthcare standards.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Dr. Robert Chen', role: t('about.cmo', 'Chief Medical Officer'), img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop' },
              { name: 'Sarah Williams', role: t('about.ceo', 'Chief Executive Officer'), img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop' },
              { name: 'Dr. James Mitchell', role: t('about.hos', 'Head of Surgery'), img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop' }
            ].map((leader, i) => (
              <div key={i} className="text-center">
                <img src={leader.img} alt={leader.name} className="w-48 h-48 rounded-full object-cover mx-auto mb-6 shadow-md" />
                <h3 className="text-xl font-bold text-gray-900">{leader.name}</h3>
                <p className="text-emerald-600 font-medium">{leader.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
