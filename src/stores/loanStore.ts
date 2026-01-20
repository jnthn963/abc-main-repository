/**
 * Loan Store - P2P Lending Engine
 * Manages loan listings, funding, and auto-repayment logic
 * 
 * NOTE: This is a client-side prototype store. In production, all loan operations
 * must be validated server-side with proper RLS policies and database triggers.
 */

import { z } from 'zod';
import { getMemberData, getSystemStats, saveSystemStats, generateReferenceNumber } from './memberStore';

// Validation schemas
export const loanAmountSchema = z.number()
  .min(100, "Minimum loan is ₱100")
  .max(5000000, "Maximum loan is ₱5,000,000");

// Types
export interface P2PLoan {
  id: string;
  borrowerId: string;
  borrowerAlias: string;
  lenderId?: string;
  lenderAlias?: string;
  principalAmount: number;
  interestRate: number;
  interestAmount: number;
  duration: number; // days (fixed 30)
  status: 'open' | 'funded' | 'repaid' | 'defaulted';
  collateralAmount: number;
  createdAt: Date;
  fundedAt?: Date;
  dueAt?: Date;
  repaidAt?: Date;
  autoRepayTriggered: boolean;
  referenceNumber: string;
}

// Storage key
const LOANS_STORAGE_KEY = 'abc-p2p-loans';

// Subscription system
type LoanListener = () => void;
const loanListeners = new Set<LoanListener>();

export const subscribeLoanStore = (callback: LoanListener): (() => void) => {
  loanListeners.add(callback);
  return () => loanListeners.delete(callback);
};

const notifyLoanListeners = (): void => {
  loanListeners.forEach(cb => cb());
};

// Load loans from localStorage
export const getLoans = (): P2PLoan[] => {
  try {
    const stored = localStorage.getItem(LOANS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((loan: P2PLoan) => ({
        ...loan,
        createdAt: new Date(loan.createdAt),
        fundedAt: loan.fundedAt ? new Date(loan.fundedAt) : undefined,
        dueAt: loan.dueAt ? new Date(loan.dueAt) : undefined,
        repaidAt: loan.repaidAt ? new Date(loan.repaidAt) : undefined,
      }));
    }
  } catch (e) {
    console.error('Failed to load loans:', e);
  }
  return getDefaultLoans();
};

// Save loans to localStorage
const saveLoans = (loans: P2PLoan[]): void => {
  try {
    localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(loans));
    notifyLoanListeners();
  } catch (e) {
    console.error('Failed to save loans:', e);
  }
};

// Generate masked alias from member ID
export const generateAlias = (memberId: string): string => {
  const parts = memberId.split('-');
  if (parts.length >= 3) {
    const last4 = parts[2].slice(-1);
    return `${parts[0][0]}***${last4}`;
  }
  return memberId.slice(0, 1) + '***' + memberId.slice(-1);
};

// Default mock loans for the marketplace
const getDefaultLoans = (): P2PLoan[] => {
  const now = new Date();
  return [
    {
      id: crypto.randomUUID(),
      borrowerId: 'ABC-2026-0004',
      borrowerAlias: 'A***4',
      principalAmount: 15000,
      interestRate: 12.5,
      interestAmount: 1875,
      duration: 30,
      status: 'open',
      collateralAmount: 30000,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      autoRepayTriggered: false,
      referenceNumber: generateReferenceNumber(),
    },
    {
      id: crypto.randomUUID(),
      borrowerId: 'ABC-2026-0002',
      borrowerAlias: 'B***2',
      principalAmount: 8500,
      interestRate: 10.0,
      interestAmount: 850,
      duration: 30,
      status: 'open',
      collateralAmount: 17000,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      autoRepayTriggered: false,
      referenceNumber: generateReferenceNumber(),
    },
    {
      id: crypto.randomUUID(),
      borrowerId: 'ABC-2026-0009',
      borrowerAlias: 'C***9',
      principalAmount: 25000,
      interestRate: 15.0,
      interestAmount: 3750,
      duration: 30,
      status: 'open',
      collateralAmount: 50000,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      autoRepayTriggered: false,
      referenceNumber: generateReferenceNumber(),
    },
    {
      id: crypto.randomUUID(),
      borrowerId: 'ABC-2026-0001',
      borrowerAlias: 'D***1',
      principalAmount: 5000,
      interestRate: 8.5,
      interestAmount: 425,
      duration: 30,
      status: 'open',
      collateralAmount: 10000,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      autoRepayTriggered: false,
      referenceNumber: generateReferenceNumber(),
    },
    {
      id: crypto.randomUUID(),
      borrowerId: 'ABC-2026-0007',
      borrowerAlias: 'E***7',
      principalAmount: 50000,
      interestRate: 18.0,
      interestAmount: 9000,
      duration: 30,
      status: 'open',
      collateralAmount: 100000,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      autoRepayTriggered: false,
      referenceNumber: generateReferenceNumber(),
    },
  ];
};

// Get open loans (available for funding)
export const getOpenLoans = (): P2PLoan[] => {
  return getLoans().filter(loan => loan.status === 'open');
};

// Get funded loans (active)
export const getFundedLoans = (): P2PLoan[] => {
  return getLoans().filter(loan => loan.status === 'funded');
};

// Get loans by borrower
export const getLoansByBorrower = (borrowerId: string): P2PLoan[] => {
  return getLoans().filter(loan => loan.borrowerId === borrowerId);
};

// Get loans by lender
export const getLoansByLender = (lenderId: string): P2PLoan[] => {
  return getLoans().filter(loan => loan.lenderId === lenderId);
};

// Create a new loan request
export const createLoanRequest = (
  borrowerId: string,
  principalAmount: number,
  interestRate: number
): P2PLoan | { error: string } => {
  // Validate amount
  const amountValidation = loanAmountSchema.safeParse(principalAmount);
  if (!amountValidation.success) {
    return { error: amountValidation.error.errors[0].message };
  }

  const member = getMemberData();
  
  // Check 50% collateral rule
  const maxLoan = member.vaultBalance * 0.5;
  if (principalAmount > maxLoan) {
    return { error: `Maximum loan is ₱${maxLoan.toLocaleString()} (50% of vault balance)` };
  }

  // Create loan
  const loan: P2PLoan = {
    id: crypto.randomUUID(),
    borrowerId,
    borrowerAlias: generateAlias(borrowerId),
    principalAmount,
    interestRate,
    interestAmount: principalAmount * (interestRate / 100),
    duration: 30,
    status: 'open',
    collateralAmount: principalAmount, // Equal to loan = 50% of vault for 100% coverage
    createdAt: new Date(),
    autoRepayTriggered: false,
    referenceNumber: generateReferenceNumber(),
  };

  // Lock collateral in frozen balance
  member.frozenBalance += loan.collateralAmount;
  member.vaultBalance -= loan.collateralAmount;
  
  // Save
  const loans = getLoans();
  loans.push(loan);
  saveLoans(loans);
  
  // Update system stats
  const stats = getSystemStats();
  saveSystemStats(stats);

  return loan;
};

// Fund a loan (lender action)
export const fundLoan = (
  loanId: string,
  lenderId: string
): P2PLoan | { error: string } => {
  const loans = getLoans();
  const loanIndex = loans.findIndex(l => l.id === loanId);
  
  if (loanIndex === -1) {
    return { error: 'Loan not found' };
  }

  const loan = loans[loanIndex];
  
  if (loan.status !== 'open') {
    return { error: 'Loan is no longer available' };
  }

  if (loan.borrowerId === lenderId) {
    return { error: 'Cannot fund your own loan' };
  }

  const now = new Date();
  
  // Update loan
  loan.lenderId = lenderId;
  loan.lenderAlias = generateAlias(lenderId);
  loan.status = 'funded';
  loan.fundedAt = now;
  loan.dueAt = new Date(now.getTime() + loan.duration * 24 * 60 * 60 * 1000);

  // Save loans
  loans[loanIndex] = loan;
  saveLoans(loans);

  // Update system stats
  const stats = getSystemStats();
  stats.totalActiveLoans += loan.principalAmount;
  stats.activeLoansCount += 1;
  saveSystemStats(stats);

  return loan;
};

// Process loan repayment
export const repayLoan = (
  loanId: string,
  borrowerId: string
): P2PLoan | { error: string } => {
  const loans = getLoans();
  const loanIndex = loans.findIndex(l => l.id === loanId);
  
  if (loanIndex === -1) {
    return { error: 'Loan not found' };
  }

  const loan = loans[loanIndex];
  
  if (loan.status !== 'funded') {
    return { error: 'Loan is not active' };
  }

  if (loan.borrowerId !== borrowerId) {
    return { error: 'Not authorized to repay this loan' };
  }

  const member = getMemberData();
  const totalRepayment = loan.principalAmount + loan.interestAmount;

  if (member.vaultBalance < totalRepayment) {
    return { error: `Insufficient balance. Need ₱${totalRepayment.toLocaleString()}` };
  }

  // Deduct repayment from borrower
  member.vaultBalance -= totalRepayment;
  
  // Release collateral
  member.frozenBalance -= loan.collateralAmount;
  member.vaultBalance += loan.collateralAmount;

  // Update loan
  loan.status = 'repaid';
  loan.repaidAt = new Date();
  loan.autoRepayTriggered = false;

  // Save all changes
  loans[loanIndex] = loan;
  saveLoans(loans);
  
  // Note: Lender receives funds (simulated - would be database operation)
  // In production, this would update the lender's vault balance

  // Update system stats
  const stats = getSystemStats();
  stats.totalActiveLoans -= loan.principalAmount;
  stats.activeLoansCount -= 1;
  saveSystemStats(stats);

  return loan;
};

// Process default with Reserve Fund auto-repayment
export const processDefault = (
  loanId: string
): P2PLoan | { error: string } => {
  const loans = getLoans();
  const loanIndex = loans.findIndex(l => l.id === loanId);
  
  if (loanIndex === -1) {
    return { error: 'Loan not found' };
  }

  const loan = loans[loanIndex];
  
  if (loan.status !== 'funded') {
    return { error: 'Loan is not active' };
  }

  const stats = getSystemStats();
  const totalPayout = loan.principalAmount + loan.interestAmount;

  // Check reserve fund has enough
  if (stats.reserveFund < totalPayout) {
    return { error: 'Reserve fund insufficient for auto-repayment' };
  }

  // Deduct from reserve fund
  stats.reserveFund -= totalPayout;

  // Update loan
  loan.status = 'defaulted';
  loan.autoRepayTriggered = true;
  loan.repaidAt = new Date();

  // Forfeit borrower's collateral to reserve fund
  stats.reserveFund += loan.collateralAmount;

  // Save all changes
  loans[loanIndex] = loan;
  saveLoans(loans);
  
  stats.totalActiveLoans -= loan.principalAmount;
  stats.activeLoansCount -= 1;
  saveSystemStats(stats);

  // Note: Lender receives funds from reserve (simulated)
  // In production, this would update the lender's vault balance

  return loan;
};

// Check for overdue loans and process defaults
export const checkOverdueLoans = (): void => {
  const now = Date.now();
  const loans = getLoans();
  let hasChanges = false;

  loans.forEach((loan, index) => {
    if (loan.status === 'funded' && loan.dueAt && now >= loan.dueAt.getTime()) {
      const result = processDefault(loan.id);
      if (!('error' in result)) {
        hasChanges = true;
        console.log(`Auto-repayment triggered for loan ${loan.id}`);
      }
    }
  });

  if (hasChanges) {
    notifyLoanListeners();
  }
};

// Calculate marketplace statistics
export const getMarketplaceStats = () => {
  const loans = getLoans();
  const openLoans = loans.filter(l => l.status === 'open');
  const fundedLoans = loans.filter(l => l.status === 'funded');
  const completedLoans = loans.filter(l => l.status === 'repaid' || l.status === 'defaulted');

  const totalOpenValue = openLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalFundedValue = fundedLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const averageInterestRate = openLoans.length > 0
    ? openLoans.reduce((sum, l) => sum + l.interestRate, 0) / openLoans.length
    : 0;

  return {
    openLoansCount: openLoans.length,
    fundedLoansCount: fundedLoans.length,
    completedLoansCount: completedLoans.length,
    totalOpenValue,
    totalFundedValue,
    averageInterestRate,
  };
};

// Initialize - check for overdue loans periodically
if (typeof window !== 'undefined') {
  setInterval(checkOverdueLoans, 60000); // Check every minute
}

// Initialize default loans if empty
const initLoans = getLoans();
if (initLoans.length === 0) {
  saveLoans(getDefaultLoans());
}
