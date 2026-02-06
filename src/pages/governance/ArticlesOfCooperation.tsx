import { motion } from 'framer-motion';
import { FileText, Calendar, MapPin, Users, Target, Shield, CheckCircle } from 'lucide-react';
import GovernanceLayout from '@/components/governance/GovernanceLayout';

const articles = [
  {
    number: 'I',
    title: 'NAME AND PRINCIPAL OFFICE',
    content: `The name of this cooperative shall be "ALPHA BANKERS COOPERATIVE" (hereinafter referred to as the "Cooperative"). The principal office of the Cooperative shall be located at Bonifacio Global City, Taguig, Metro Manila, Philippines. The Cooperative may establish branches, offices, or agencies in other places as the Board of Directors may determine.`
  },
  {
    number: 'II',
    title: 'TERM OF EXISTENCE',
    content: `The Cooperative shall exist for a period of fifty (50) years from the date of registration with the Cooperative Development Authority (CDA), unless sooner dissolved in accordance with law or these Articles of Cooperation.`
  },
  {
    number: 'III',
    title: 'PURPOSE AND OBJECTIVES',
    content: `The Cooperative is organized for the primary purpose of encouraging thrift and savings among its members, creating funds in order to grant loans to members for productive and provident purposes, and providing other financial services to its members. The Cooperative shall operate as a credit cooperative and shall engage in the following activities:
    
    a) Accept savings deposits from members;
    b) Grant loans to members for productive, provident, and other purposes;
    c) Invest funds not needed for immediate use in authorized investments;
    d) Acquire, lease, or dispose of real and personal properties;
    e) Enter into contracts and agreements necessary for cooperative operations.`
  },
  {
    number: 'IV',
    title: 'MEMBERSHIP',
    content: `Membership in the Cooperative shall be voluntary and open to all natural persons who are citizens of the Philippines, of legal age, and who meet the qualifications prescribed by the By-Laws. Members must subscribe to at least one (1) share of the authorized share capital and pay the membership fee as determined by the Board of Directors.`
  },
  {
    number: 'V',
    title: 'SHARE CAPITAL',
    content: `The authorized share capital of the Cooperative shall be FIVE HUNDRED MILLION PESOS (₱500,000,000.00), divided into FIVE MILLION (5,000,000) common shares with a par value of ONE HUNDRED PESOS (₱100.00) per share. The subscribed share capital shall be at least TWENTY-FIVE PERCENT (25%) of the authorized share capital, and the paid-up capital shall be at least TWENTY-FIVE PERCENT (25%) of the subscribed share capital.`
  },
  {
    number: 'VI',
    title: 'BOARD OF DIRECTORS',
    content: `The business and affairs of the Cooperative shall be managed by a Board of Directors composed of fifteen (15) members who shall be elected by the General Assembly from among the regular members. Directors shall serve for a term of two (2) years and may be re-elected for two (2) consecutive terms.`
  },
  {
    number: 'VII',
    title: 'OFFICERS',
    content: `The officers of the Cooperative shall consist of a Chairperson, Vice-Chairperson, Secretary, Treasurer, and such other officers as may be provided for in the By-Laws. Officers shall be elected by the Board of Directors from among themselves.`
  },
  {
    number: 'VIII',
    title: 'DISTRIBUTION OF NET SURPLUS',
    content: `The net surplus of the Cooperative shall be distributed in accordance with the Cooperative Code of the Philippines and the By-Laws. A minimum of ten percent (10%) shall be set aside as reserve fund, and the remainder may be distributed as patronage refunds, dividends, and other allocations as approved by the General Assembly.`
  }
];

export default function ArticlesOfCooperation() {
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
              <FileText className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                Articles of Cooperation
              </h1>
              <p className="text-sm text-gray-500">
                Foundation Document of Alpha Bankers Cooperative
              </p>
            </div>
          </div>

          {/* Document Meta */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] border border-gray-800/50">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">Ratified: January 2026</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] border border-gray-800/50">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">BGC, Taguig, Philippines</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/30">
              <Shield className="w-3.5 h-3.5 text-[#00FF41]" />
              <span className="text-xs text-[#00FF41]">CDA Registered</span>
            </div>
          </div>
        </motion.div>

        {/* Preamble */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 p-6 rounded-lg bg-[#0a0a0a] border border-gray-800/50"
        >
          <h2 className="text-lg font-bold text-[#D4AF37] mb-4 uppercase tracking-wider">
            Preamble
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            We, the undersigned Filipino citizens, of legal age, and residents of the Philippines, 
            do hereby voluntarily associate ourselves together for the purpose of organizing a 
            cooperative under Republic Act No. 9520, otherwise known as the "Philippine Cooperative 
            Code of 2008" and in accordance with the rules and regulations promulgated by the 
            Cooperative Development Authority.
          </p>
        </motion.div>

        {/* Articles */}
        <div className="space-y-6">
          {articles.map((article, index) => (
            <motion.article
              key={article.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
              className="p-6 rounded-lg bg-[#0a0a0a] border border-gray-800/50 hover:border-[#D4AF37]/20 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#D4AF37]">{article.number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-3 uppercase tracking-wider">
                    Article {article.number}: {article.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                    {article.content}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Certification Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 p-6 rounded-lg bg-gradient-to-r from-[#D4AF37]/5 via-[#0a0a0a] to-[#D4AF37]/5 border border-[#D4AF37]/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-[#00FF41]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Document Certification
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            This document has been duly registered with the Cooperative Development Authority (CDA) 
            in accordance with Republic Act No. 9520. Any amendments shall require approval by the 
            General Assembly and registration with the CDA.
          </p>
        </motion.div>
      </div>
    </GovernanceLayout>
  );
}
