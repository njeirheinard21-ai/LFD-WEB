import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, Leaf, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { products } from '../data/products';
import { useTranslation } from 'react-i18next';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const WHATSAPP_NUMBER = "237695821095"; // Replace with actual WhatsApp number

  const product = products.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('products.not_found', 'Product Not Found')}</h2>
        <p className="text-gray-600 mb-8">{t('products.not_found_desc', 'The product you are looking for does not exist or has been removed.')}</p>
        <button 
          onClick={() => navigate('/products')}
          className="bg-[#059669] text-white px-6 py-3 rounded-full font-bold hover:bg-[#047857] transition-colors"
        >
          {t('products.back', 'Back to Products')}
        </button>
      </div>
    );
  }

  const getWhatsAppLink = () => {
    const message = `Hello, I would like to order ${product.name} from Optimal Healthcare. Please provide more details.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <Link 
          to="/products" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#059669] font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" /> {t('products.back_to_all', 'Back to all products')}
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* Product Image */}
            <div className="relative h-[400px] lg:h-[600px] bg-gray-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {product.rating >= 4.9 && (
                <div className="absolute top-6 left-6 bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                  {t('products.best_seller', 'Best Seller')}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-[#8B5CF6] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {product.rating} ({product.reviews} {t('products.reviews', 'reviews')})
                  </div>
                </div>

                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {product.name}
                </h1>
                
                <div className="text-2xl font-bold text-[#059669] mb-8">
                  {product.price}
                </div>

                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {product.description}
                </p>

                {/* Features */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-[#059669]" />
                    <span className="font-medium">{t('products.ingredients', '100% Natural Ingredients')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-[#059669]" />
                    <span className="font-medium">{t('products.tested', 'Clinically Tested & Approved')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-[#059669]" />
                    <span className="font-medium">{t('products.guarantee', 'Premium Quality Guarantee')}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#128C7E] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 min-h-[56px] text-lg"
                  >
                    <MessageCircle className="h-6 w-6" />
                    {t('products.order_whatsapp', 'Order on WhatsApp')}
                  </a>
                </div>
                
                <p className="text-sm text-gray-500 mt-6 text-center sm:text-left">
                  {t('products.whatsapp_disclaimer', '* For pricing and delivery details, please contact us directly via WhatsApp. Our team responds within minutes.')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-6 w-6 text-[#059669]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t('products.organic', '100% Organic')}</h3>
            <p className="text-gray-600 text-sm">{t('products.organic_desc', 'Sourced from the finest natural ingredients without harmful chemicals.')}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-[#8B5CF6]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t('products.clinically_tested', 'Clinically Tested')}</h3>
            <p className="text-gray-600 text-sm">{t('products.tested_desc', 'Rigorously tested to ensure safety, efficacy, and premium quality.')}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t('products.highly_rated', 'Highly Rated')}</h3>
            <p className="text-gray-600 text-sm">{t('products.rated_desc', 'Trusted by thousands of customers for their daily wellness routines.')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
