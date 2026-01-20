/**
 * Interest Engine - Daily Vault Interest Calculation
 * Simulates daily compounding interest on vault balances
 * 
 * NOTE: This is a client-side simulation. In production, this must be
 * implemented as a server-side cron job with database triggers.
 * 
 * Per Knowledge Base:
 * - Interest rate: 0.3% to 0.5% daily (admin adjustable)
 * - Applied every 24 hours at midnight
 * - Logged in the ledger table
 */

import { getMemberData, getSystemStats, generateReferenceNumber, subscribeMemberStore } from './memberStore';

// Storage keys
const INTEREST_HISTORY_KEY = 'abc-interest-history';
const LAST_INTEREST_CALC_KEY = 'abc-last-interest-calc';

// Types
export interface InterestRecord {
  id: string;
  memberId: string;
  date: Date;
  previousBalance: number;
  interestRate: number;
  interestAmount: number;
  newBalance: number;
  referenceNumber: string;
}

// Subscription system
type InterestListener = () => void;
const interestListeners = new Set<InterestListener>();

export const subscribeInterestStore = (callback: InterestListener): (() => void) => {
  interestListeners.add(callback);
  return () => interestListeners.delete(callback);
};

const notifyInterestListeners = (): void => {
  interestListeners.forEach(cb => cb());
};

// Get interest history from localStorage
export const getInterestHistory = (): InterestRecord[] => {
  try {
    const stored = localStorage.getItem(INTEREST_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((record: InterestRecord) => ({
        ...record,
        date: new Date(record.date),
      }));
    }
  } catch (e) {
    console.error('Failed to load interest history:', e);
  }
  return [];
};

// Save interest history to localStorage
const saveInterestHistory = (history: InterestRecord[]): void => {
  try {
    localStorage.setItem(INTEREST_HISTORY_KEY, JSON.stringify(history));
    notifyInterestListeners();
  } catch (e) {
    console.error('Failed to save interest history:', e);
  }
};

// Get last interest calculation timestamp
export const getLastInterestCalcTime = (): Date | null => {
  try {
    const stored = localStorage.getItem(LAST_INTEREST_CALC_KEY);
    if (stored) {
      return new Date(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Failed to load last interest calc time:', e);
  }
  return null;
};

// Save last interest calculation timestamp
const saveLastInterestCalcTime = (date: Date): void => {
  try {
    localStorage.setItem(LAST_INTEREST_CALC_KEY, JSON.stringify(date.toISOString()));
  } catch (e) {
    console.error('Failed to save last interest calc time:', e);
  }
};

// Check if interest should be calculated (24 hours since last calculation)
export const shouldCalculateInterest = (): boolean => {
  const lastCalc = getLastInterestCalcTime();
  if (!lastCalc) return true; // First time
  
  const now = Date.now();
  const hoursSinceLastCalc = (now - lastCalc.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastCalc >= 24;
};

// Get time until next interest calculation
export const getTimeUntilNextInterest = (): number => {
  const lastCalc = getLastInterestCalcTime();
  if (!lastCalc) return 0;
  
  const nextCalc = lastCalc.getTime() + (24 * 60 * 60 * 1000);
  const remaining = nextCalc - Date.now();
  
  return Math.max(0, remaining);
};

// Calculate and apply daily interest
export const calculateDailyInterest = (): InterestRecord | null => {
  const member = getMemberData();
  const stats = getSystemStats();
  
  // Only apply interest if there's a positive vault balance
  if (member.vaultBalance <= 0) {
    console.log('No vault balance to apply interest');
    return null;
  }
  
  // Get interest rate from system settings (0.3% to 0.5%)
  const interestRate = stats.vaultInterestRate / 100; // Convert percentage to decimal
  
  // Calculate interest amount
  const interestAmount = Math.floor(member.vaultBalance * interestRate * 100) / 100;
  
  // Create interest record
  const record: InterestRecord = {
    id: crypto.randomUUID(),
    memberId: member.id,
    date: new Date(),
    previousBalance: member.vaultBalance,
    interestRate: stats.vaultInterestRate,
    interestAmount,
    newBalance: member.vaultBalance + interestAmount,
    referenceNumber: generateReferenceNumber(),
  };
  
  // Update member balance (direct add - no clearing period for interest)
  const memberData = getMemberData();
  memberData.vaultBalance += interestAmount;
  
  // Add interest transaction to history
  memberData.transactions.push({
    id: record.id,
    type: 'interest',
    amount: interestAmount,
    status: 'completed', // Interest is immediately credited
    createdAt: new Date(),
    clearingEndsAt: new Date(), // No clearing
    referenceNumber: record.referenceNumber,
    destinationType: 'Vault Interest',
    destinationName: `Daily ${stats.vaultInterestRate}% Yield`,
  });
  
  // Save member data
  try {
    localStorage.setItem('abc-member-data', JSON.stringify(memberData));
  } catch (e) {
    console.error('Failed to save member data with interest:', e);
  }
  
  // Update system total deposits
  stats.totalVaultDeposits += interestAmount;
  try {
    localStorage.setItem('abc-system-stats', JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save system stats:', e);
  }
  
  // Save interest record to history
  const history = getInterestHistory();
  history.unshift(record); // Add to beginning
  
  // Keep only last 30 days of history
  const trimmedHistory = history.slice(0, 30);
  saveInterestHistory(trimmedHistory);
  
  // Update last calculation time
  saveLastInterestCalcTime(new Date());
  
  console.log(`Interest applied: ₱${interestAmount.toLocaleString()} at ${stats.vaultInterestRate}%`);
  
  return record;
};

// Process any pending interest on app load
export const processInterestOnLoad = (): InterestRecord | null => {
  if (shouldCalculateInterest()) {
    return calculateDailyInterest();
  }
  return null;
};

// Get total interest earned (last 30 days)
export const getTotalInterestEarned = (): number => {
  const history = getInterestHistory();
  return history.reduce((sum, record) => sum + record.interestAmount, 0);
};

// Get today's interest (if calculated)
export const getTodaysInterest = (): InterestRecord | null => {
  const history = getInterestHistory();
  if (history.length === 0) return null;
  
  const today = new Date();
  const latestRecord = history[0];
  
  // Check if latest record is from today
  if (
    latestRecord.date.getDate() === today.getDate() &&
    latestRecord.date.getMonth() === today.getMonth() &&
    latestRecord.date.getFullYear() === today.getFullYear()
  ) {
    return latestRecord;
  }
  
  return null;
};

// Get average daily interest (last 7 days)
export const getAverageDailyInterest = (): number => {
  const history = getInterestHistory();
  const last7Days = history.slice(0, 7);
  
  if (last7Days.length === 0) return 0;
  
  const total = last7Days.reduce((sum, record) => sum + record.interestAmount, 0);
  return total / last7Days.length;
};

// Format interest for display
export const formatInterestAmount = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Simulate interest calculation for demo purposes
// This allows users to "fast forward" to see interest being applied
export const simulateInterestPayment = (): InterestRecord => {
  // Force calculation regardless of time
  const member = getMemberData();
  const stats = getSystemStats();
  
  const interestRate = stats.vaultInterestRate / 100;
  const interestAmount = Math.floor(member.vaultBalance * interestRate * 100) / 100;
  
  const record: InterestRecord = {
    id: crypto.randomUUID(),
    memberId: member.id,
    date: new Date(),
    previousBalance: member.vaultBalance,
    interestRate: stats.vaultInterestRate,
    interestAmount,
    newBalance: member.vaultBalance + interestAmount,
    referenceNumber: generateReferenceNumber(),
  };
  
  // Update member balance
  const memberData = getMemberData();
  memberData.vaultBalance += interestAmount;
  
  memberData.transactions.push({
    id: record.id,
    type: 'interest',
    amount: interestAmount,
    status: 'completed',
    createdAt: new Date(),
    clearingEndsAt: new Date(),
    referenceNumber: record.referenceNumber,
    destinationType: 'Vault Interest',
    destinationName: `Daily ${stats.vaultInterestRate}% Yield`,
  });
  
  try {
    localStorage.setItem('abc-member-data', JSON.stringify(memberData));
  } catch (e) {
    console.error('Failed to save member data:', e);
  }
  
  const history = getInterestHistory();
  history.unshift(record);
  saveInterestHistory(history.slice(0, 30));
  saveLastInterestCalcTime(new Date());
  
  // Notify all subscribers
  notifyInterestListeners();
  
  return record;
};

// Initialize - check and process interest on module load
if (typeof window !== 'undefined') {
  // Process interest on load
  const result = processInterestOnLoad();
  if (result) {
    console.log('Daily interest processed on load:', result);
  }
  
  // Check for interest every hour
  setInterval(() => {
    if (shouldCalculateInterest()) {
      calculateDailyInterest();
    }
  }, 60 * 60 * 1000); // Every hour
}
