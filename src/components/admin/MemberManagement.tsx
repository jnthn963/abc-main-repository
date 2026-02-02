/**
 * ABC Master Build: Member Management Component
 * Uses get_profiles_for_admin RPC for secure admin access with audit logging
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Users, Search, Shield, Mail, Phone, 
  MapPin, Calendar, BadgeCheck, AlertCircle,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
  Eye, EyeOff
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MemberProfile {
  id: string;
  member_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  vault_balance: number;
  frozen_balance: number;
  lending_balance: number;
  membership_tier: string;
  kyc_status: string;
  onboarding_completed: boolean;
  created_at: string;
  last_login_at: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  referral_code: string | null;
  referrer_id: string | null;
  total_referral_earnings: number;
  security_question_1: string | null;
  security_question_2: string | null;
}

const MemberManagement = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showSecurityInfo, setShowSecurityInfo] = useState<Record<string, boolean>>({});

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_profiles_for_admin');

      if (rpcError) {
        throw rpcError;
      }

      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load member data. Please ensure you have admin privileges.');
      toast({
        title: "Access Error",
        description: "Failed to load member profiles. Admin access required.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => 
      member.member_id.toLowerCase().includes(query) ||
      member.display_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const formatBalance = (cents: number) => {
    return `₱${Math.floor(cents / 100).toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'founding': return 'bg-primary/20 text-primary border-primary/50';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/50';
      default: return 'bg-orange-600/20 text-orange-400 border-orange-600/50';
    }
  };

  const getKycColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success/20 text-success border-success/50';
      case 'rejected': return 'bg-destructive/20 text-destructive border-destructive/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const toggleSecurityInfo = (memberId: string) => {
    setShowSecurityInfo(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 border-border">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading member data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-card/50 border-border">
        <div className="flex items-center justify-center py-12 text-destructive">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/50 border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Member Management</h2>
          <Badge variant="outline" className="ml-2">
            {filteredMembers.length} members
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMembers}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Member ID, name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/20 border-border"
        />
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[140px]">Member ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Vault Balance</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <Collapsible
                  key={member.id}
                  open={expandedMember === member.id}
                  onOpenChange={(open) => setExpandedMember(open ? member.id : null)}
                >
                  <TableRow className="hover:bg-muted/20">
                    <TableCell className="font-mono text-sm text-primary">
                      {member.member_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.display_name || 'Unnamed Member'}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-success">
                      {formatBalance(member.vault_balance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getTierColor(member.membership_tier)} capitalize`}>
                        {member.membership_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getKycColor(member.kyc_status)} capitalize`}>
                        {member.kyc_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(member.last_login_at)}
                    </TableCell>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1">
                          {expandedMember === member.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/10">
                      <TableCell colSpan={7} className="p-4">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-3 gap-6"
                        >
                          {/* Contact & Address */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              Contact & Address
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {member.email || 'No email'}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {member.phone || 'No phone'}
                              </div>
                              {(member.address_line1 || member.city) && (
                                <div className="text-muted-foreground mt-2">
                                  {member.address_line1 && <p>{member.address_line1}</p>}
                                  {member.address_line2 && <p>{member.address_line2}</p>}
                                  {member.city && (
                                    <p>{member.city}, {member.province} {member.postal_code}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Financial Summary */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <BadgeCheck className="w-4 h-4 text-success" />
                              Financial Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="p-2 rounded bg-success/10 border border-success/20">
                                <p className="text-xs text-muted-foreground">Vault</p>
                                <p className="font-mono text-success">{formatBalance(member.vault_balance)}</p>
                              </div>
                              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Lending</p>
                                <p className="font-mono text-primary">{formatBalance(member.lending_balance)}</p>
                              </div>
                              <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-xs text-muted-foreground">Frozen</p>
                                <p className="font-mono text-yellow-400">{formatBalance(member.frozen_balance)}</p>
                              </div>
                              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                                <p className="text-xs text-muted-foreground">Referral Earnings</p>
                                <p className="font-mono text-purple-400">{formatBalance(member.total_referral_earnings)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Security Questions */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4 text-destructive" />
                                Security Questions
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSecurityInfo(member.id)}
                                className="h-7 text-xs"
                              >
                                {showSecurityInfo[member.id] ? (
                                  <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Show
                                  </>
                                )}
                              </Button>
                            </div>
                            {showSecurityInfo[member.id] ? (
                              <div className="space-y-2 text-sm">
                                <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                                  <p className="text-xs text-muted-foreground">Question 1</p>
                                  <p className="text-foreground">
                                    {member.security_question_1 || 'Not set'}
                                  </p>
                                </div>
                                <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                                  <p className="text-xs text-muted-foreground">Question 2</p>
                                  <p className="text-foreground">
                                    {member.security_question_2 || 'Not set'}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                  Note: Answers are securely hashed and cannot be viewed.
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Click "Show" to view security questions
                              </p>
                            )}
                          </div>
                        </motion.div>

                        {/* Additional Info Row */}
                        <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined: {formatDate(member.created_at)}
                          </div>
                          <div>
                            Referral Code: <span className="font-mono text-primary">{member.referral_code || 'None'}</span>
                          </div>
                          <div>
                            Onboarding: {member.onboarding_completed ? (
                              <span className="text-success">Complete</span>
                            ) : (
                              <span className="text-yellow-400">Incomplete</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default MemberManagement;
