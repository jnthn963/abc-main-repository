import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Users, Building, ChevronRight, Shield, Scale } from 'lucide-react';

const governanceLinks = [
  {
    title: 'Articles of Cooperation',
    href: '/governance/articles',
    icon: FileText,
    description: 'Foundation document'
  },
  {
    title: 'Board of Directors',
    href: '/governance/board',
    icon: Users,
    description: 'Board resolutions'
  },
  {
    title: 'General Assembly',
    href: '/governance/assembly',
    icon: Building,
    description: 'Assembly resolutions'
  }
];

export default function GovernanceSidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 min-h-screen bg-[#0a0a0a] border-r border-gray-800/50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Governance
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Legal Documents
            </p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-[#D4AF37]/50 via-[#D4AF37]/20 to-transparent" />
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2">
        {governanceLinks.map((link, index) => {
          const isActive = location.pathname === link.href;
          
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={link.href}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' 
                    : 'hover:bg-[#0f0f0f] border border-transparent hover:border-gray-800/50'
                  }
                `}
              >
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  ${isActive ? 'bg-[#D4AF37]/20' : 'bg-[#0f0f0f]'}
                `}>
                  <link.icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                    {link.title}
                  </p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                    {link.description}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-gray-700'}`} />
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* CDA Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 p-4 rounded-lg bg-[#050505] border border-gray-800/50"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-[#00FF41]" />
          <span className="text-[10px] font-bold text-[#00FF41] uppercase tracking-wider">
            CDA Registered
          </span>
        </div>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          All documents are verified and maintained in accordance with CDA regulations.
        </p>
      </motion.div>

      {/* Back to Home */}
      <Link
        to="/"
        className="flex items-center gap-2 mt-6 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors"
      >
        <ChevronRight className="w-3 h-3 rotate-180" />
        <span>Return to Main Site</span>
      </Link>
    </aside>
  );
}
