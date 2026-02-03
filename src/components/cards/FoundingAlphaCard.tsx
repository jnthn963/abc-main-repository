import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
interface FoundingAlphaCardProps {
  memberName?: string;
  memberId?: string;
  isActive?: boolean;
  showQR?: boolean;
  className?: string;
}
export function FoundingAlphaCard({
  memberName = 'JONATHAN DELA CRUZ',
  memberId = '0001',
  isActive = true,
  showQR = true,
  className = ''
}: FoundingAlphaCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    setRotateY(mouseX / 12);
    setRotateX(-mouseY / 12);
  };
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };
  return <motion.div className={`relative w-[340px] md:w-[420px] h-[220px] md:h-[270px] cursor-pointer mx-auto ${className}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} animate={{
    rotateX: rotateX + 15,
    // Base 15-degree angle
    rotateY,
    y: [0, -8, 0]
  }} transition={{
    rotateX: {
      duration: 0.15
    },
    rotateY: {
      duration: 0.15
    },
    y: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }} style={{
    transformStyle: 'preserve-3d',
    perspective: '1200px'
  }}>
      {/* Deep Shadow for 3D depth */}
      <div className="absolute inset-0 rounded-2xl blur-3xl translate-y-6 scale-90" style={{
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 70%)'
    }} />
      
      {/* Card Body - Brushed Obsidian with Diamond-Cut Border */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
      background: `
            linear-gradient(135deg, 
              #1a1a1a 0%, 
              #0d0d0d 25%, 
              #151515 50%, 
              #0a0a0a 75%, 
              #1a1a1a 100%
            )
          `,
      boxShadow: `
            inset 0 1px 2px rgba(255,255,255,0.08),
            inset 0 -1px 2px rgba(0,0,0,0.5),
            0 25px 80px rgba(0,0,0,0.6)
          `
    }}>
        {/* Diamond-Cut Gold Border */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        border: '1px solid transparent',
        background: `linear-gradient(145deg, #D4AF37, #8B7500, #D4AF37, #A0892C) border-box`,
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude'
      }} />

        {/* Micro-Etched Vertical Metallic Grain (Brushed Obsidian Texture) */}
        <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 1px,
                rgba(255,255,255,0.015) 1px,
                rgba(255,255,255,0.015) 2px
              )
            `
      }} />

        {/* Rim Lighting Effect (Top-Right Gold Lens Flare) */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-40 blur-3xl" style={{
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.5) 0%, transparent 60%)'
      }} />

        {/* Secondary Rim Light */}
        <div className="absolute top-0 right-0 w-32 h-1" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.6) 50%, rgba(255, 223, 100, 0.8) 100%)',
        filter: 'blur(1px)'
      }} />

        {/* Card Content */}
        <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
          {/* Header - ABC Crest + Card Logos */}
          <div className="flex items-start justify-between">
            {/* 3D Gold ABC Geometric Crest */}
            <div className="relative">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, #D4AF37 0%, #8B7500 50%, #D4AF37 100%)',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'
            }}>
                <span className="text-lg font-extrabold" style={{
                color: '#0a0a0a',
                textShadow: '0 1px 0 rgba(255,255,255,0.3)'
              }}>
                  ABC  
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{
                color: '#D4AF37'
              }}>
                  Founding Alpha
                </span>
              </div>
            </div>

            {/* Visa & Mastercard Logos (Etched Metallic Foil) */}
            <div className="flex items-center gap-1 opacity-60">
              {/* Visa-style logo */}
              <div className="px-2 py-1 rounded text-[8px] font-bold tracking-wider" style={{
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              textShadow: '0 0 4px rgba(212, 175, 55, 0.3)'
            }}>
                VISA
              </div>
              {/* Mastercard-style logo */}
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-[#D4AF37]/40" />
                <div className="w-4 h-4 rounded-full bg-[#A0892C]/40" />
              </div>
            </div>
          </div>

          {/* Member Info - Deeply Embossed Gold-Leaf Typography */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{
            color: 'rgba(212, 175, 55, 0.5)'
          }}>CARD HOLDER NAME</p>
            <h3 className="text-2xl tracking-wide text-primary md:text-2xl" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 40%, #8B7500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            filter: 'drop-shadow(0 1px 0 #8B7500)'
          }}>
              {memberName}
            </h3>
          </div>

          {/* Footer - ID, Status, QR Code */}
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              {/* Member ID - Laser-Etched Gold-Bronze */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em]" style={{
                color: 'rgba(160, 137, 44, 0.6)'
              }}>COOP MEMBER  ID</p>
                <p className="text-lg font-mono font-semibold tracking-wider" style={{
                color: '#B8966E',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
              }}>
                  {memberId}
                </p>
              </div>
              
              {/* Status - Laser-Etched */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em]" style={{
                color: 'rgba(160, 137, 44, 0.6)'
              }}>
                  Status
                </p>
                <p className="text-sm font-semibold uppercase tracking-wider" style={{
                color: isActive ? '#B8966E' : '#666',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
              }}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>

            {/* Gold-Tinctured QR Code */}
            {showQR && <div className="w-16 h-16 rounded-lg p-1.5" style={{
            background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.15), rgba(139, 117, 0, 0.1))',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}>
                {/* Simplified QR Pattern */}
                <div className="w-full h-full grid grid-cols-5 gap-0.5" style={{
              opacity: 0.7
            }}>
                  {[...Array(25)].map((_, i) => <div key={i} className="rounded-sm" style={{
                background: [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 19, 20, 22, 23, 24].includes(i) ? '#D4AF37' : 'transparent'
              }} />)}
                </div>
              </div>}
          </div>
        </div>

        {/* Bottom Gold Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
        background: 'linear-gradient(90deg, transparent 5%, #D4AF37 30%, #F5D76E 50%, #D4AF37 70%, transparent 95%)'
      }} />
      </div>
    </motion.div>;
}
export default FoundingAlphaCard;