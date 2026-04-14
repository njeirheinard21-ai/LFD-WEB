import { useState } from 'react';
import { ShoppingBag, MessageCircle, Star, ShieldCheck, Leaf, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

export default function Products() {
  const WHATSAPP_NUMBER = "237695821095"; // Replace with actual WhatsApp number

  const categories = ['All', 'Nutrition', 'Wellness', 'Beverage', 'Skincare', 'Skincare & Nutrition'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getWhatsAppLink = (productName: string) => {
    const message = `Hello, I would like to order ${productName} from Optimal Healthcare. Please provide more details.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-purple-50 py-20 lg:py-32 text-center border-b border-purple-100 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              <Leaf className="h-4 w-4" /> 100% Natural Ingredients
            </span>
            <h1 className="text-[clamp(2.5rem,4vw,4rem)] font-bold text-gray-900 mb-6 leading-tight">
              Our Health <span className="text-[#05c770]">Products</span>
            </h1>
            <p className="text-gray-600 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
              Natural, safe, and effective products carefully formulated to support your journey to optimal health and vitality.
            </p>
            <a 
              href="#products" 
              className="inline-flex justify-center items-center gap-2 bg-[#059669] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl min-h-[44px]"
            >
              <ShoppingBag className="h-5 w-5" />
              Shop Now
            </a>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-gray-600 font-medium">
            <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-[#05c770]" /> Clinically Tested</div>
            <div className="flex items-center gap-2"><Leaf className="h-6 w-6 text-[#05c770]" /> 100% Organic</div>
            <div className="flex items-center gap-2"><Star className="h-6 w-6 text-yellow-400" /> Premium Quality</div>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section id="products" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium text-sm md:text-base transition-colors min-h-[44px] ${
                  activeCategory === cat 
                    ? 'bg-[#8B5CF6] text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#8B5CF6] hover:text-[#8B5CF6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={product.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {product.rating >= 4.9 && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Best Seller
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">{product.category}</span>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {product.rating} ({product.reviews})
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h3>
                  <p className="text-gray-600 mb-6 flex-grow text-sm leading-relaxed">{product.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <div className="text-lg font-bold text-gray-900">{product.price}</div>
                    
                    <Link 
                      to={`/products/${product.id}`}
                      className="w-full flex justify-center items-center gap-2 bg-white text-[#8B5CF6] border border-[#8B5CF6] font-bold px-5 py-2.5 rounded-xl hover:bg-[#8B5CF6] hover:text-white transition-colors min-h-[44px]"
                    >
                      View Details <ArrowRight className="h-4 w-4" />
                    </Link>
                    
                    <a 
                      href={getWhatsAppLink(product.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex justify-center items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#128C7E] transition-colors shadow-sm hover:shadow-md min-h-[44px]"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Order on WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
