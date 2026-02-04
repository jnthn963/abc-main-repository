/**
 * ABC Master Build: CMS Manager (Sovereign Broadcast)
 * Governor-controlled content management for announcements and news
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  X,
  Image,
  Video,
  FileText,
  RefreshCw,
  Loader2,
  Bell,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";

interface CMSPost {
  id: string;
  title: string;
  body_text: string;
  media_type: 'text' | 'image' | 'video' | null;
  content_url: string | null;
  is_active: boolean;
  is_announcement: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PostForm {
  title: string;
  body_text: string;
  media_type: 'text' | 'image' | 'video';
  content_url: string;
  is_active: boolean;
  is_announcement: boolean;
}

const defaultForm: PostForm = {
  title: '',
  body_text: '',
  media_type: 'text',
  content_url: '',
  is_active: true,
  is_announcement: false,
};

export default function CMSManager() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CMSPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<CMSPost | null>(null);
  const [form, setForm] = useState<PostForm>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<CMSPost | null>(null);

  // Fetch all posts (admin can see all, including inactive)
  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cms_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as CMSPost[]);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 15s
  usePollingRefresh(fetchPosts, {
    interval: 15000,
    enabled: true,
    immediate: true,
  });

  // Handle form changes
  const updateForm = (updates: Partial<PostForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Open editor for new post
  const handleNewPost = () => {
    setEditingPost(null);
    setForm(defaultForm);
    setShowEditor(true);
  };

  // Open editor for editing
  const handleEditPost = (post: CMSPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      body_text: post.body_text,
      media_type: (post.media_type as 'text' | 'image' | 'video') || 'text',
      content_url: post.content_url || '',
      is_active: post.is_active,
      is_announcement: post.is_announcement,
    });
    setShowEditor(true);
  };

  // Save post
  const handleSavePost = async () => {
    if (!form.title.trim() || !form.body_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and body are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPost) {
        // Update existing
        const { error } = await supabase
          .from('cms_posts')
          .update({
            title: form.title.trim(),
            body_text: form.body_text.trim(),
            media_type: form.media_type,
            content_url: form.content_url.trim() || null,
            is_active: form.is_active,
            is_announcement: form.is_announcement,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id);

        if (error) throw error;

        toast({
          title: "Post Updated",
          description: "Sovereign broadcast updated successfully",
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('cms_posts')
          .insert({
            title: form.title.trim(),
            body_text: form.body_text.trim(),
            media_type: form.media_type,
            content_url: form.content_url.trim() || null,
            is_active: form.is_active,
            is_announcement: form.is_announcement,
            author_id: user?.id || null,
          });

        if (error) throw error;

        toast({
          title: "Post Created",
          description: "New sovereign broadcast published",
        });
      }

      setShowEditor(false);
      fetchPosts();
    } catch (err) {
      console.error('Failed to save post:', err);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle post visibility
  const handleToggleActive = async (post: CMSPost) => {
    try {
      const { error } = await supabase
        .from('cms_posts')
        .update({ 
          is_active: !post.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: post.is_active ? "Post Hidden" : "Post Published",
        description: `"${post.title}" is now ${post.is_active ? 'hidden' : 'visible'}`,
      });

      fetchPosts();
    } catch (err) {
      console.error('Failed to toggle post:', err);
      toast({
        title: "Error",
        description: "Failed to update post visibility",
        variant: "destructive",
      });
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('cms_posts')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: `"${deleteConfirm.title}" has been removed`,
      });

      setDeleteConfirm(null);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const getMediaIcon = (type: string | null) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className="p-5 bg-card/50 border-border h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Sovereign Broadcast</h2>
            <Badge variant="outline" className="ml-2">
              {posts.filter(p => p.is_active).length} active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPosts}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={handleNewPost}
              className="gap-2 bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading broadcasts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border rounded-lg">
              <Megaphone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No broadcasts yet</p>
              <Button size="sm" onClick={handleNewPost} variant="outline">
                Create First Broadcast
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`p-4 rounded-lg border transition-colors ${
                    post.is_active 
                      ? 'bg-muted/20 border-primary/20 hover:border-primary/40' 
                      : 'bg-muted/10 border-border opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`p-1 rounded ${post.is_active ? 'bg-primary/20' : 'bg-muted/30'}`}>
                          {getMediaIcon(post.media_type)}
                        </span>
                        <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                        {post.is_announcement && (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">
                            <Bell className="w-3 h-3 mr-1" />
                            Popup
                          </Badge>
                        )}
                        {!post.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.body_text}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.created_at)}
                        </span>
                        {post.content_url && (
                          <span className="text-primary truncate max-w-[150px]">
                            {post.content_url}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(post)}
                        className="h-8 w-8 p-0"
                        title={post.is_active ? 'Hide post' : 'Show post'}
                      >
                        {post.is_active ? (
                          <Eye className="w-4 h-4 text-success" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(post)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              {editingPost ? 'Edit Broadcast' : 'New Broadcast'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Announcement title..."
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="bg-muted/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Write your broadcast message..."
                value={form.body_text}
                onChange={(e) => updateForm({ body_text: e.target.value })}
                rows={4}
                className="bg-muted/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Media Type</label>
                <Select
                  value={form.media_type}
                  onValueChange={(v) => updateForm({ media_type: v as 'text' | 'image' | 'video' })}
                >
                  <SelectTrigger className="bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Text Only
                      </span>
                    </SelectItem>
                    <SelectItem value="image">
                      <span className="flex items-center gap-2">
                        <Image className="w-4 h-4" /> Image
                      </span>
                    </SelectItem>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Video className="w-4 h-4" /> Video
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Media URL</label>
                <Input
                  placeholder={form.media_type === 'text' ? 'N/A' : 'https://...'}
                  value={form.content_url}
                  onChange={(e) => updateForm({ content_url: e.target.value })}
                  disabled={form.media_type === 'text'}
                  className="bg-muted/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
              <div>
                <p className="text-sm font-medium">Show as Login Popup</p>
                <p className="text-xs text-muted-foreground">Display as announcement popup on login</p>
              </div>
              <Switch
                checked={form.is_announcement}
                onCheckedChange={(v) => updateForm({ is_announcement: v })}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
              <div>
                <p className="text-sm font-medium">Active (Visible)</p>
                <p className="text-xs text-muted-foreground">Make this broadcast visible to members</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => updateForm({ is_active: v })}
                className="data-[state=checked]:bg-success"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingPost ? 'Save Changes' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Broadcast
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
