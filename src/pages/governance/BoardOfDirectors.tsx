import { motion } from 'framer-motion';
import { Users, Calendar, FileText, Shield, CheckCircle, Award, Briefcase } from 'lucide-react';
import GovernanceLayout from '@/components/governance/GovernanceLayout';

const boardMembers = [
  { position: 'Chairperson', name: 'To be elected by General Assembly', term: '2026-2028' },
  { position: 'Vice-Chairperson', name: 'To be elected by General Assembly', term: '2026-2028' },
  { position: 'Secretary', name: 'To be elected by General Assembly', term: '2026-2028' },
  { position: 'Treasurer', name: 'To be elected by General Assembly', term: '2026-2028' },
  { position: 'Auditor', name: 'To be elected by General Assembly', term: '2026-2028' }
];

const resolutions = [
  {
    number: 'BR-2026-001',
    title: 'Resolution Adopting the Articles of Cooperation',
    date: 'January 15, 2026',
    status: 'Ratified',
    summary: 'The Board of Directors hereby resolves to adopt the Articles of Cooperation as the foundation document of Alpha Bankers Cooperative, in accordance with R.A. 9520.'
  },
  {
    number: 'BR-2026-002',
    title: 'Resolution Adopting the By-Laws',
    date: 'January 15, 2026',
    status: 'Ratified',
    summary: 'The Board of Directors hereby resolves to adopt the By-Laws governing the internal affairs and operations of the Cooperative.'
  },
  {
    number: 'BR-2026-003',
    title: 'Resolution on Membership Fee Structure',
    date: 'January 20, 2026',
    status: 'Ratified',
    summary: 'The Board establishes the membership fee at ₱500.00 and the minimum share capital subscription at ₱1,000.00 per member.'
  },
  {
    number: 'BR-2026-004',
    title: 'Resolution on Interest Rate Policy',
    date: 'January 25, 2026',
    status: 'Ratified',
    summary: 'The Board establishes the interest rate policy for savings deposits and loans, ensuring competitive rates for member benefit.'
  },
  {
    number: 'BR-2026-005',
    title: 'Resolution on Credit Policies',
    date: 'February 1, 2026',
    status: 'Ratified',
    summary: 'The Board adopts credit policies governing loan applications, approval procedures, and collection processes.'
  }
];

export default function BoardOfDirectors() {
  return (
    <GovernanceLayout>
      <div className="p-8 lg:p-12">
        {/* Document Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                Board of Directors
              </h1>
              <p className="text-sm text-gray-500">
                Governance & Board Resolutions
              </p>
            </div>
          </div>

          {/* Document Meta */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] border border-gray-800/50">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">Term: 2026-2028</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
              <Shield className="w-3.5 h-3.5 text-[#00FF41]" />
              <span className="text-xs text-[#00FF41]">CDA Compliant</span>
            </div>
          </div>
        </motion.div>

        {/* Board Composition */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold text-[#D4AF37] mb-6 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Board Composition
          </h2>
          
          <div className="grid gap-4">
            {boardMembers.map((member, index) => (
              <motion.div
                key={member.position}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="p-4 rounded-lg bg-[#0a0a0a] border border-gray-800/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{member.position}</p>
                    <p className="text-xs text-gray-500">{member.name}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                  {member.term}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Board Resolutions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-[#D4AF37] mb-6 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Board Resolutions
          </h2>

          <div className="space-y-4">
            {resolutions.map((resolution, index) => (
              <motion.article
                key={resolution.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
                className="p-6 rounded-lg bg-[#0a0a0a] border border-gray-800/50 hover:border-[#D4AF37]/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#D4AF37]">{resolution.number}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="text-xs text-gray-500">{resolution.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {resolution.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
                    <CheckCircle className="w-3 h-3 text-[#00FF41]" />
                    <span className="text-[10px] font-bold text-[#00FF41] uppercase">
                      {resolution.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {resolution.summary}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Authority Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 p-6 rounded-lg bg-gradient-to-r from-[#D4AF37]/5 via-[#0a0a0a] to-[#D4AF37]/5 border border-[#D4AF37]/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#00FF41]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Board Authority
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            The Board of Directors is vested with the authority to manage the business and affairs 
            of the Cooperative in accordance with the Articles of Cooperation, By-Laws, and 
            applicable laws. All resolutions are subject to ratification by the General Assembly 
            where required by law or the By-Laws.
          </p>
        </motion.div>
      </div>
    </GovernanceLayout>
  );
}
