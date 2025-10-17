import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#333333] to-[#1a1a1a] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#48dbfb] to-[#54a0ff] rounded-[10px] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="font-bold text-2xl">Paolino</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              La tua destinazione per magliette, felpe e accessori di qualità.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-5 text-lg uppercase tracking-wide">Prodotti</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/products?category=magliette" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Magliette
                </Link>
              </li>
              <li>
                <Link to="/products?category=felpe" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Felpe
                </Link>
              </li>
              <li>
                <Link to="/products?category=sciarpe" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Sciarpe
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessori" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Accessori
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-5 text-lg uppercase tracking-wide">Account</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/profile" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Il mio profilo
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  I miei ordini
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Carrello
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-5 text-lg uppercase tracking-wide">Informazioni</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/contact" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Contatti
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Spedizioni
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Resi
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-[#48dbfb] transition-all duration-300 hover:translate-x-1 inline-block">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 text-center">
          <p className="text-white/50 text-sm font-medium tracking-wide">
            © 2024 Paolino. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;