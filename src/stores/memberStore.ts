/**
 * Member Store - Core Financial Engine
 * Manages vault balances, loan eligibility, and transaction states
 */

import { z } from 'zod';

// Validation schemas
export const amountSchema = z.number()
  .min(100, "Minimum amount is ₱100")
  .max(10000000, "Maximum amount is ₱10,000,000");

export const memberIdSchema = z.string()
  .regex(/^ABC-\d{4}-\d{4}$/, "Invalid Member ID format (ABC-XXXX-XXXX)");

// Types
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_funded' | 'loan_received' | 'interest';
  amount: number;
  status: 'pending' | 'clearing' | 'completed' | 'failed';
  createdAt: Date;
  clearingEndsAt: Date;
  destinationType?: string;
  destinationName?: string;
  referenceNumber: string;
}

export interface LoanRequest {
  id: string;
  borrowerId: string;
  lenderId?: string;
  principalAmount: number;
  interestRate: number;
  duration: number; // days
  status: 'open' | 'funded' | 'repaid' | 'defaulted';
  createdAt: Date;
}

export interface MemberData {
  id: string;
  vaultBalance: number;
  frozenBalance: number;
  membershipTier: 'Bronze' | 'Silver' | 'Gold';
  createdAt: Date;
  lastDepositAt?: Date;
  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  transactions: Transaction[];
  activeLoans: LoanRequest[];
}

// System-wide statistics
export interface SystemStats {
  totalVaultDeposits: number;
  totalActiveLoans: number;
  activeLoansCount: number;
  reserveFund: number;
  vaultInterestRate: number;
  lendingYieldRate: number;
}

// Constants
const CLEARING_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
const AGING_PERIOD_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (144 hours)
const COLLATERAL_RATIO = 0.5; // 50% max loan

const STORAGE_KEY = 'abc-member-data';
const SYSTEM_STORAGE_KEY = 'abc-system-stats';

// Generate reference number
export const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ABC-${timestamp}-${random}`;
};

// Default member data (mock authenticated user)
const getDefaultMemberData = (): MemberData => ({
  id: 'ABC-2026-0007',
  vaultBalance: 103037.50,
  frozenBalance: 15000.00,
  membershipTier: 'Gold',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  lastDepositAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  kycStatus: 'Verified',
  transactions: [],
  activeLoans: [],
});

// Default system stats
const getDefaultSystemStats = (): SystemStats => ({
  totalVaultDeposits: 12450000,
  totalActiveLoans: 2340000,
  activeLoansCount: 156,
  reserveFund: 1240500,
  vaultInterestRate: 0.5,
  lendingYieldRate: 15.0,
});

// Load member data from localStorage
export const getMemberData = (): MemberData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastDepositAt: parsed.lastDepositAt ? new Date(parsed.lastDepositAt) : undefined,
        transactions: parsed.transactions.map((t: Transaction) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          clearingEndsAt: new Date(t.clearingEndsAt),
        })),
        activeLoans: parsed.activeLoans.map((l: LoanRequest) => ({
          ...l,
          createdAt: new Date(l.createdAt),
        })),
      };
    }
  } catch (e) {
    console.error('Failed to load member data:', e);
  }
  return getDefaultMemberData();
};

// Save member data to localStorage
const saveMemberData = (data: MemberData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save member data:', e);
  }
};

// Load system stats from localStorage
export const getSystemStats = (): SystemStats => {
  try {
    const stored = localStorage.getItem(SYSTEM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load system stats:', e);
  }
  return getDefaultSystemStats();
};

// Save system stats to localStorage
export const saveSystemStats = (stats: SystemStats): void => {
  try {
    localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(stats));
    notifySubscribers();
  } catch (e) {
    console.error('Failed to save system stats:', e);
  }
};

// Calculate Bulls vs Bears sentiment (based on loan-to-deposit ratio)
export const calculateMarketSentiment = (): number => {
  const stats = getSystemStats();
  if (stats.totalVaultDeposits === 0) return 50;
  
  // Ratio of active loans to total deposits
  // Higher ratio = more bullish (more lending activity)
  const ratio = stats.totalActiveLoans / stats.totalVaultDeposits;
  
  // Scale to 0-100, with 0.2 ratio being neutral (50%)
  // > 0.2 = bullish, < 0.2 = bearish
  const sentiment = Math.min(100, Math.max(0, (ratio / 0.4) * 100));
  return Math.round(sentiment);
};

// Check if funds are aged (6-day rule)
export const areFundsAged = (): boolean => {
  const member = getMemberData();
  const referenceDate = member.lastDepositAt || member.createdAt;
  const ageMs = Date.now() - referenceDate.getTime();
  return ageMs >= AGING_PERIOD_MS;
};

// Get time remaining until funds are aged
export const getAgingTimeRemaining = (): number => {
  const member = getMemberData();
  const referenceDate = member.lastDepositAt || member.createdAt;
  const ageMs = Date.now() - referenceDate.getTime();
  const remaining = AGING_PERIOD_MS - ageMs;
  return Math.max(0, remaining);
};

// Calculate max loan amount (50% collateral rule)
export const calculateMaxLoan = (): number => {
  const member = getMemberData();
  // Available balance is vault minus already frozen
  const availableForCollateral = member.vaultBalance;
  return Math.floor(availableForCollateral * COLLATERAL_RATIO * 100) / 100;
};

// Validate loan request
export const validateLoanRequest = (amount: number): { valid: boolean; error?: string } => {
  const maxLoan = calculateMaxLoan();
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }
  
  if (amount > maxLoan) {
    return { valid: false, error: `Maximum loan is ₱${maxLoan.toLocaleString()} (50% of vault balance)` };
  }
  
  if (!areFundsAged()) {
    const remaining = getAgingTimeRemaining();
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    return { valid: false, error: `Funds must age for ${days} more day(s) before requesting a loan` };
  }
  
  return { valid: true };
};

// Create a new transaction with 24-hour clearing
export const createTransaction = (
  type: Transaction['type'],
  amount: number,
  destinationType?: string,
  destinationName?: string
): Transaction => {
  const now = new Date();
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    status: 'clearing',
    createdAt: now,
    clearingEndsAt: new Date(now.getTime() + CLEARING_PERIOD_MS),
    destinationType,
    destinationName,
    referenceNumber: generateReferenceNumber(),
  };
  
  // Update member data
  const member = getMemberData();
  member.transactions.push(transaction);
  
  // For deposits, update lastDepositAt and add to frozen
  if (type === 'deposit') {
    member.lastDepositAt = now;
    member.frozenBalance += amount;
  }
  
  // For withdrawals/transfers, freeze the amount
  if (type === 'withdrawal' || type === 'transfer') {
    member.vaultBalance -= amount;
    member.frozenBalance += amount;
  }
  
  saveMemberData(member);
  notifySubscribers();
  
  return transaction;
};

// Get pending transactions with clearing countdown
export const getPendingTransactions = (): Transaction[] => {
  const member = getMemberData();
  return member.transactions.filter(t => t.status === 'clearing');
};

// Process cleared transactions (should be called periodically)
export const processClearedTransactions = (): void => {
  const member = getMemberData();
  const now = Date.now();
  let hasChanges = false;
  
  member.transactions.forEach(t => {
    if (t.status === 'clearing' && now >= t.clearingEndsAt.getTime()) {
      t.status = 'completed';
      hasChanges = true;
      
      // Move funds from frozen to vault for deposits
      if (t.type === 'deposit') {
        member.frozenBalance -= t.amount;
        member.vaultBalance += t.amount;
      }
      
      // For withdrawals/transfers, just reduce frozen
      if (t.type === 'withdrawal' || t.type === 'transfer') {
        member.frozenBalance -= t.amount;
      }
    }
  });
  
  if (hasChanges) {
    saveMemberData(member);
    notifySubscribers();
  }
};

// Get clearing time remaining for a transaction
export const getClearingTimeRemaining = (transaction: Transaction): number => {
  if (transaction.status !== 'clearing') return 0;
  return Math.max(0, transaction.clearingEndsAt.getTime() - Date.now());
};

// Subscription system for reactivity
type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

export const subscribeMemberStore = (callback: Subscriber): (() => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

const notifySubscribers = (): void => {
  subscribers.forEach(cb => cb());
};

// Initialize - process any cleared transactions on load
processClearedTransactions();

// Check for cleared transactions every minute
if (typeof window !== 'undefined') {
  setInterval(processClearedTransactions, 60000);
}
