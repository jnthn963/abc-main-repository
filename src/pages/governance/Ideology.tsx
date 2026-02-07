import { motion } from 'framer-motion';
import { ArrowLeft, Shield, TrendingUp, Users, Coins, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlobalFooter from '@/components/layout/GlobalFooter';

/**
 * Ideology Page - The Sovereign Manifesto
 * 
 * Features:
 * 1. Official Letter from the Governor (Formal Correspondence)
 * 2. The Banga ng Kasaganaan Story Section (Ideology of Trust)
 * 3. Key Pillars: Paniniwala, Paglago, Himala ng Sustentabilidad
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Ideology() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#C5A059]/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16"
      >
        {/* Section 1: The Official Letter from the Governor */}
        <motion.section variants={itemVariants} className="mb-16 md:mb-24">
          {/* Formal Correspondence Container */}
          <div 
            className="relative p-6 md:p-10 lg:p-12 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(15, 15, 18, 0.98), rgba(10, 10, 12, 0.99))',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              boxShadow: '0 0 60px rgba(197, 160, 89, 0.08), inset 0 0 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* ABC Sovereign Seal Watermark */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: 'url(/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />

            {/* Letter Header */}
            <div className="relative z-10 text-center mb-8 md:mb-10">
              <img
                src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
                alt="ABC Sovereign Seal"
                className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full"
                style={{ filter: 'drop-shadow(0 0 15px rgba(197, 160, 89, 0.4))' }}
              />
              <h1 
                className="text-lg md:text-xl font-semibold tracking-[0.15em] uppercase mb-2"
                style={{ 
                  color: '#C5A059',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Mula sa Tanggapan ng Governor
              </h1>
              <p className="text-xs text-gray-600 tracking-wider">
                ALPHA BANKERS COOPERATIVE • OFFICIAL CORRESPONDENCE
              </p>
            </div>

            {/* Decorative Divider */}
            <div 
              className="w-24 h-px mx-auto mb-8"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.5), transparent)',
              }}
            />

            {/* Letter Body */}
            <div 
              className="relative z-10 space-y-6 text-gray-400 leading-relaxed"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              <p className="text-sm md:text-base">
                <span className="text-[#C5A059]">Mahal kong Miyembro,</span>
              </p>

              <p className="text-sm md:text-base">
                Maligayang pagdating sa <span className="text-[#C5A059]">Alpha Bankers Cooperative</span>—isang komunidad na binuo 
                sa pundasyon ng tiwala, disiplina, at sama-samang pag-unlad.
              </p>

              <p className="text-sm md:text-base">
                Hindi tayo ordinaryong institusyon. Tayo ay isang kilusan—isang <span className="text-[#C5A059] italic">Republic of Capital</span>—kung 
                saan ang bawat miyembro ay may boses, may bahagi sa tubo, at may dignidad na hindi kinukuha ng sistemang 
                tradisyonal.
              </p>

              <p className="text-sm md:text-base">
                Ang ating <span className="text-[#C5A059]">0.5% Daily Vault Yield</span> ay hindi pangako ng milagro. Ito ay resulta ng 
                disiplinadong pagpapatakbo, transparency, at ang pinakamakapangyarihang puhunan: <span className="text-[#C5A059] font-semibold">ang 
                kolektibong tiwala ng komunidad</span>.
              </p>

              <p className="text-sm md:text-base">
                Sa bawat piso na iyong ilalagay sa Vault, ikaw ay nag-aambag sa likididad ng sistema. At dahil dito, 
                ang buong kooperatiba ay lumalago—<span className="text-[#C5A059]">kasama ka</span>.
              </p>

              <p className="text-sm md:text-base">
                Hindi na tayo magpapa-alipin sa barya. <span className="text-[#C5A059] font-semibold">Tayo ang may-ari ng sistema.</span>
              </p>

              <p className="text-sm md:text-base mt-8">
                Sa paglilingkod at karangalan,
              </p>

              {/* Digital Signature - Sovereign Gold SVG */}
              <div className="mt-6 pt-4">
                {/* Clean, Bold SVG Signature Path */}
                <svg 
                  viewBox="0 0 300 80" 
                  className="w-48 md:w-56 h-auto mb-3"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(197, 160, 89, 0.4))' }}
                >
                  <path
                    d="M10 55 Q15 20 35 35 T55 30 Q70 25 80 40 T95 35 Q105 30 115 45 T130 40 
                       M140 25 L140 55 M140 40 L160 40 M160 25 L160 55
                       M175 55 Q175 30 195 30 Q215 30 215 42 Q215 55 195 55 Q175 55 175 42 L175 55
                       M230 30 L230 55 M230 30 Q250 25 260 35 T270 55"
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ 
                      strokeDasharray: 500,
                      strokeDashoffset: 0,
                    }}
                  />
                </svg>
                <p className="text-xs text-gray-600 tracking-wider uppercase">
                  Supreme Governor, Alpha Bankers Cooperative
                </p>
                <p className="text-[10px] text-gray-700 mt-1">
                  Founding Date: January 2026 • Republic of the Philippines
                </p>
              </div>
            </div>

            {/* Gold Corner Accents */}
            <div 
              className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 rounded-tl-lg"
              style={{ borderColor: 'rgba(197, 160, 89, 0.3)' }}
            />
            <div 
              className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 rounded-tr-lg"
              style={{ borderColor: 'rgba(197, 160, 89, 0.3)' }}
            />
            <div 
              className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 rounded-bl-lg"
              style={{ borderColor: 'rgba(197, 160, 89, 0.3)' }}
            />
            <div 
              className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 rounded-br-lg"
              style={{ borderColor: 'rgba(197, 160, 89, 0.3)' }}
            />
          </div>
        </motion.section>

        {/* Section 2: The Banga ng Kasaganaan Story */}
        <motion.section variants={itemVariants} className="mb-16 md:mb-24">
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ 
                color: '#C5A059',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Ang Banga ng Kasaganaan
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              Isang alegorya ng kolektibong yaman—kung saan ang bawat miyembro ay nag-aambag at 
              nakakatanggap mula sa iisang pinagkukunan ng kasaganaan.
            </p>
          </div>

          {/* The Golden Jar Infographic */}
          <div 
            className="relative p-8 md:p-12 rounded-xl overflow-hidden mb-12"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(197, 160, 89, 0.08), transparent 70%)',
              border: '1px solid rgba(197, 160, 89, 0.15)',
            }}
          >
            {/* Central Banga Visualization */}
            <div className="flex flex-col items-center mb-10">
              <div 
                className="relative w-32 h-40 md:w-40 md:h-48 mb-6"
                style={{
                  background: 'linear-gradient(180deg, rgba(197, 160, 89, 0.3), rgba(197, 160, 89, 0.1))',
                  borderRadius: '40% 40% 50% 50% / 20% 20% 60% 60%',
                  boxShadow: '0 0 40px rgba(197, 160, 89, 0.2), inset 0 -20px 40px rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(197, 160, 89, 0.4)',
                }}
              >
                {/* Coins flowing in */}
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-bounce"
                  style={{ animationDuration: '2s' }}
                >
                  🪙
                </div>
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
                >
                  ₱
                </div>
              </div>
              <p 
                className="text-sm font-mono tracking-wider"
                style={{ color: '#C5A059' }}
              >
                ANG BANGA NG KASAGANAAN
              </p>
              <p className="text-xs text-gray-600 mt-1">
                The Golden Jar of Collective Wealth
              </p>
            </div>

            {/* Flow Arrows */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Inflow */}
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#00FF41]" />
                </div>
                <p className="text-xs text-[#00FF41] font-mono mb-1">DEPOSITS</p>
                <p className="text-[10px] text-gray-600">Members contribute to the Banga</p>
              </div>

              {/* Circulation */}
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-[#C5A059]" />
                </div>
                <p className="text-xs text-[#C5A059] font-mono mb-1">CIRCULATION</p>
                <p className="text-[10px] text-gray-600">Capital flows through P2P Lending</p>
              </div>

              {/* Outflow */}
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#00FF41]" />
                </div>
                <p className="text-xs text-[#00FF41] font-mono mb-1">YIELDS</p>
                <p className="text-[10px] text-gray-600">0.5% Daily returns to members</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: The Three Pillars */}
        <motion.section variants={itemVariants} className="mb-16">
          <div className="text-center mb-10">
            <h3 
              className="text-xl md:text-2xl font-semibold mb-3"
              style={{ 
                color: '#C5A059',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Ang Tatlong Haligi ng Ating Ideolohiya
            </h3>
            <p className="text-xs text-gray-600">The Three Pillars of Our Ideology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Ang Paniniwala */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-lg"
              style={{
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.9), rgba(15, 15, 18, 0.95))',
                border: '1px solid rgba(197, 160, 89, 0.15)',
              }}
            >
              <div className="w-10 h-10 mb-4 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#C5A059]" />
              </div>
              <h4 
                className="text-base font-semibold mb-2"
                style={{ color: '#C5A059' }}
              >
                Ang Paniniwala
              </h4>
              <p className="text-xs text-gray-500 mb-3 font-mono">THE 90/10 RULE</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sa bawat 10 miyembro, 9 ay nagtitiwala na hindi lahat ay sabay-sabay na mag-withdraw. 
                Ang kolektibong paniniwala na ito ang nagpapalakas sa likididad ng sistema—hindi ang 
                pisikal na pera, kundi ang <span className="text-[#C5A059]">tiwala</span>.
              </p>
            </motion.div>

            {/* Pillar 2: Ang Paglago */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-lg"
              style={{
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.9), rgba(15, 15, 18, 0.95))',
                border: '1px solid rgba(197, 160, 89, 0.15)',
              }}
            >
              <div className="w-10 h-10 mb-4 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#C5A059]" />
              </div>
              <h4 
                className="text-base font-semibold mb-2"
                style={{ color: '#C5A059' }}
              >
                Ang Paglago
              </h4>
              <p className="text-xs text-gray-500 mb-3 font-mono">ECONOMIC VELOCITY</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ang pera ay hindi natutulog sa ating Vault. Sa pamamagitan ng <span className="text-[#C5A059]">50/50 Liquidity Protocol</span>, 
                ang kapital ay umiikot—nagpapahiram, kumikita, at bumabalik sa may-ari nang may dagdag na halaga.
              </p>
            </motion.div>

            {/* Pillar 3: Ang Himala ng Sustentabilidad */}
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-lg"
              style={{
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.9), rgba(15, 15, 18, 0.95))',
                border: '1px solid rgba(197, 160, 89, 0.15)',
              }}
            >
              <div className="w-10 h-10 mb-4 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00FF41]" />
              </div>
              <h4 
                className="text-base font-semibold mb-2"
                style={{ color: '#C5A059' }}
              >
                Ang Himala ng Sustentabilidad
              </h4>
              <p className="text-xs text-gray-500 mb-3 font-mono">0.5% DAILY ACCRUED INTEREST</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Hindi ito magic. Ito ay resulta ng <span className="text-[#00FF41]">disiplinadong operasyon</span>, 
                100% collateral backing, at komunidad na nagbabahaginan ng tubo. Ang bawat miyembro ay 
                stakeholder—<span className="text-[#C5A059]">hindi customer</span>.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Closing Statement */}
        <motion.section variants={itemVariants} className="text-center py-12">
          <div 
            className="inline-block px-6 py-3 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(197, 160, 89, 0.1), rgba(197, 160, 89, 0.05))',
              border: '1px solid rgba(197, 160, 89, 0.2)',
            }}
          >
            <p 
              className="text-sm tracking-[0.15em] uppercase"
              style={{ color: '#00FF41' }}
            >
              ₳฿C: INTEGRITY OUTSIDE THE SYSTEM
            </p>
          </div>
        </motion.section>
      </motion.main>

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}
