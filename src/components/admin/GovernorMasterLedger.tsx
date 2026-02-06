/**
 * ABC Master Build: Governor Master Ledger Component
 * Global Audit Trail with pagination and transaction type filters
 * All amounts use Integer Rule: FLOOR(amount / 100)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Filter, ChevronLeft, ChevronRight, 
  Loader2, TrendingUp, Coins, Users, ArrowUpRight,
  ArrowDownRight, RefreshCw, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';

interface LedgerEntry {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference_number: string;
  created_at: string;
  approval_status: string;
  member_id?: string;
}

const TRANSACTION_TYPES = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'vault_interest', label: 'Vault Interest', icon: TrendingUp },
  { id: 'lending_profit', label: 'Lending Profit', icon: Coins },
  { id: 'referral_commission', label: 'Patronage Reward', icon: Users },
  { id: 'deposit', label: 'Deposits', icon: ArrowDownRight },
  { id: 'withdrawal', label: 'Withdrawals', icon: ArrowUpRight },
];

const PAGE_SIZE = 15;

const GovernorMasterLedger = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const isFetchingRef = useRef(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchLedgerEntries = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Build base query
      const baseQuery = supabase
        .from('ledger')
        .select('*', { count: 'exact' });

      // Pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build and execute query with optional filter
      let finalQuery;
      if (filter !== 'all') {
        // Cast filter to the correct enum type
        const validTypes = ['deposit', 'withdrawal', 'transfer_out', 'transfer_in', 'lending_profit', 'vault_interest', 'loan_funding', 'loan_repayment', 'collateral_lock', 'collateral_release', 'referral_commission'] as const;
        type TransactionType = typeof validTypes[number];
        
        if (validTypes.includes(filter as TransactionType)) {
          finalQuery = baseQuery.eq('type', filter as TransactionType);
        } else {
          finalQuery = baseQuery;
        }
      } else {
        finalQuery = baseQuery;
      }

      const { data, count, error } = await finalQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setEntries(data || []);
      setTotalCount(count || 0);

      // Fetch member IDs for user mapping
      const userIdsSet = new Set<string>();
      (data || []).forEach(e => userIdsSet.add(e.user_id));
      const userIds = Array.from(userIdsSet);
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, member_id')
          .in('id', userIds);

        const map: Record<string, string> = {};
        (profiles || []).forEach(p => {
          map[p.id] = p.member_id;
        });
        setMemberMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filter, currentPage]);

  useEffect(() => {
    fetchLedgerEntries();
  }, [fetchLedgerEntries]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const formatPHP = (centavos: number) => {
    const pesos = Math.floor(centavos / 100);
    return `₱${pesos.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'vault_interest':
        return { label: 'VAULT_INT', color: 'text-success', bg: 'bg-success/20' };
      case 'lending_profit':
        return { label: 'LEND_YLD', color: 'text-primary', bg: 'bg-primary/20' };
      case 'referral_commission':
        return { label: 'REF_COMM', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      case 'deposit':
        return { label: 'DEPOSIT', color: 'text-success', bg: 'bg-success/20' };
      case 'withdrawal':
        return { label: 'WITHDRAW', color: 'text-destructive', bg: 'bg-destructive/20' };
      case 'transfer_in':
        return { label: 'TRF_IN', color: 'text-success', bg: 'bg-success/20' };
      case 'transfer_out':
        return { label: 'TRF_OUT', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'loan_funding':
        return { label: 'LOAN_FND', color: 'text-primary', bg: 'bg-primary/20' };
      case 'loan_repayment':
        return { label: 'LOAN_REP', color: 'text-success', bg: 'bg-success/20' };
      case 'collateral_lock':
        return { label: 'COLL_LCK', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'collateral_release':
        return { label: 'COLL_REL', color: 'text-success', bg: 'bg-success/20' };
      default:
        return { label: type.toUpperCase(), color: 'text-muted-foreground', bg: 'bg-muted/20' };
    }
  };

  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (approvalStatus === 'pending_review') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">PENDING</Badge>;
    }
    if (status === 'clearing') {
      return <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">CLEARING</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-success/20 text-success text-[10px]">COMPLETE</Badge>;
    }
    if (status === 'reversed') {
      return <Badge className="bg-destructive/20 text-destructive text-[10px]">REVERSED</Badge>;
    }
    return <Badge className="bg-muted/20 text-muted-foreground text-[10px]">{status}</Badge>;
  };

  return (
    <Card className="p-5 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Governor Master Ledger</h2>
          <Badge variant="outline" className="ml-2">
            {totalCount.toLocaleString()} entries
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLedgerEntries}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {TRANSACTION_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={filter === type.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type.id)}
            className={`gap-1 flex-shrink-0 ${filter === type.id ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <type.icon className="w-3 h-3" />
            {type.label}
          </Button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[100px]">Timestamp</TableHead>
              <TableHead className="w-[120px]">Member ID</TableHead>
              <TableHead className="w-[100px]">Type Code</TableHead>
              <TableHead className="w-[100px] text-right">Amount</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading ledger...</p>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, idx) => {
                const typeConfig = getTypeConfig(entry.type);
                return (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-border hover:bg-muted/20"
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">
                      {memberMap[entry.user_id] || 'SYSTEM'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-[10px] font-mono ${typeConfig.bg} ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-success">
                      {formatPHP(entry.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(entry.status, entry.approval_status)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {entry.reference_number}
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
};

export default GovernorMasterLedger;
