import { motion } from 'framer-motion';
import { Building, Calendar, Users, FileText, Shield, CheckCircle, Vote, Gavel } from 'lucide-react';
import GovernanceLayout from '@/components/governance/GovernanceLayout';

const assemblyResolutions = [
  {
    number: 'GA-2026-001',
    title: 'Resolution Ratifying the Articles of Cooperation',
    date: 'January 30, 2026',
    type: 'Organizational',
    votes: { yes: 'Unanimous', no: '0', abstain: '0' },
    summary: 'The General Assembly hereby ratifies and confirms the Articles of Cooperation of Alpha Bankers Cooperative as submitted to the Cooperative Development Authority for registration.'
  },
  {
    number: 'GA-2026-002',
    title: 'Resolution Ratifying the By-Laws',
    date: 'January 30, 2026',
    type: 'Organizational',
    votes: { yes: 'Unanimous', no: '0', abstain: '0' },
    summary: 'The General Assembly hereby ratifies and confirms the By-Laws of Alpha Bankers Cooperative, which shall govern the internal affairs of the Cooperative.'
  },
  {
    number: 'GA-2026-003',
    title: 'Resolution Electing the Board of Directors',
    date: 'January 30, 2026',
    type: 'Election',
    votes: { yes: 'Majority', no: 'N/A', abstain: 'N/A' },
    summary: 'The General Assembly hereby elects the first Board of Directors of Alpha Bankers Cooperative for the term 2026-2028.'
  },
  {
    number: 'GA-2026-004',
    title: 'Resolution Approving the Treasurer\'s Affidavit',
    date: 'January 30, 2026',
    type: 'Financial',
    votes: { yes: 'Unanimous', no: '0', abstain: '0' },
    summary: 'The General Assembly hereby approves the Treasurer\'s Affidavit certifying the initial paid-up capital of the Cooperative.'
  },
  {
    number: 'GA-2026-005',
    title: 'Resolution on Membership Rights and Obligations',
    date: 'February 15, 2026',
    type: 'Regulatory',
    votes: { yes: 'Unanimous', no: '0', abstain: '0' },
    summary: 'The General Assembly hereby affirms the rights and obligations of members as set forth in the By-Laws and in accordance with the Cooperative Code.'
  }
];

const upcomingMeetings = [
  {
    title: 'Annual General Assembly Meeting',
    date: 'First Quarter 2027',
    agenda: 'Annual Report, Financial Statements, Election of Officers'
  },
  {
    title: 'Special General Assembly (if needed)',
    date: 'As called by the Board',
    agenda: 'Matters requiring membership approval'
  }
];

export default function GeneralAssembly() {
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
              <Building className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                General Assembly
              </h1>
              <p className="text-sm text-gray-500">
                Assembly Resolutions & Member Governance
              </p>
            </div>
          </div>

          {/* Document Meta */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] border border-gray-800/50">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">Highest Governing Body</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
              <Shield className="w-3.5 h-3.5 text-[#00FF41]" />
              <span className="text-xs text-[#00FF41]">Democratic Process</span>
            </div>
          </div>
        </motion.div>

        {/* About General Assembly */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 p-6 rounded-lg bg-[#0a0a0a] border border-gray-800/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">
              About the General Assembly
            </h2>
          </div>
          <p className="text-gray-400 leading-relaxed text-sm mb-4">
            The General Assembly is the highest policy-making body of the Cooperative. It is composed 
            of all regular members in good standing, each having one vote regardless of the number of 
            shares held. The General Assembly meets at least once a year during the Annual General 
            Assembly Meeting (AGAM).
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-[#050505] border border-gray-800/30">
              <Vote className="w-5 h-5 text-[#D4AF37] mb-2" />
              <p className="text-xs font-bold text-white mb-1">One Member, One Vote</p>
              <p className="text-[10px] text-gray-500">Democratic participation</p>
            </div>
            <div className="p-4 rounded-lg bg-[#050505] border border-gray-800/30">
              <Users className="w-5 h-5 text-[#D4AF37] mb-2" />
              <p className="text-xs font-bold text-white mb-1">Quorum Required</p>
              <p className="text-[10px] text-gray-500">Majority for valid decisions</p>
            </div>
            <div className="p-4 rounded-lg bg-[#050505] border border-gray-800/30">
              <FileText className="w-5 h-5 text-[#D4AF37] mb-2" />
              <p className="text-xs font-bold text-white mb-1">Documented Minutes</p>
              <p className="text-[10px] text-gray-500">Official records maintained</p>
            </div>
          </div>
        </motion.section>

        {/* Assembly Resolutions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold text-[#D4AF37] mb-6 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Assembly Resolutions
          </h2>

          <div className="space-y-4">
            {assemblyResolutions.map((resolution, index) => (
              <motion.article
                key={resolution.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
                className="p-6 rounded-lg bg-[#0a0a0a] border border-gray-800/50 hover:border-[#D4AF37]/20 transition-colors duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[#D4AF37]">{resolution.number}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="text-xs text-gray-500">{resolution.date}</span>
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[10px] text-[#D4AF37] uppercase">
                        {resolution.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {resolution.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30 flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-[#00FF41]" />
                    <span className="text-[10px] font-bold text-[#00FF41] uppercase">
                      Approved
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {resolution.summary}
                </p>
                <div className="flex items-center gap-4 pt-3 border-t border-gray-800/50">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">YES:</span>
                    <span className="text-[10px] font-bold text-[#00FF41]">{resolution.votes.yes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">NO:</span>
                    <span className="text-[10px] font-bold text-gray-400">{resolution.votes.no}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">ABSTAIN:</span>
                    <span className="text-[10px] font-bold text-gray-400">{resolution.votes.abstain}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Upcoming Meetings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-[#D4AF37] mb-6 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Meeting Schedule
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {upcomingMeetings.map((meeting, index) => (
              <motion.div
                key={meeting.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + index * 0.1 }}
                className="p-5 rounded-lg bg-[#0a0a0a] border border-gray-800/50"
              >
                <h3 className="text-sm font-bold text-white mb-2">{meeting.title}</h3>
                <p className="text-xs text-[#D4AF37] mb-2">{meeting.date}</p>
                <p className="text-[11px] text-gray-500">
                  <span className="text-gray-600">Agenda: </span>
                  {meeting.agenda}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Authority Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 p-6 rounded-lg bg-gradient-to-r from-[#D4AF37]/5 via-[#0a0a0a] to-[#D4AF37]/5 border border-[#D4AF37]/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#00FF41]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Supreme Authority
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            As the highest policy-making body, the General Assembly has the power to amend the 
            Articles of Cooperation and By-Laws, elect the Board of Directors, approve the 
            distribution of net surplus, and decide on all matters affecting the Cooperative. 
            All members are encouraged to participate in General Assembly meetings.
          </p>
        </motion.div>
      </div>
    </GovernanceLayout>
  );
}
