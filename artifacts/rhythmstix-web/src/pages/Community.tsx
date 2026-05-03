import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, MessageSquare, Plus, ArrowLeft, Pin, Lock, Trash2,
  Send, X, Shield, ChevronRight, Users, Pencil, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/EditableText";

const API = "/api/forum";

function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin-check", { credentials: "include" });
      const data = await res.json();
      return data.authenticated as boolean;
    },
    staleTime: 60 * 1000,
  });
}

function useCategories() {
  return useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const res = await fetch(`${API}/categories`);
      return res.json();
    },
  });
}

function useTopics(categoryId: number | null) {
  return useQuery({
    queryKey: ["forum-topics", categoryId],
    queryFn: async () => {
      const url = categoryId ? `${API}/topics?categoryId=${categoryId}` : `${API}/topics`;
      const res = await fetch(url);
      return res.json();
    },
    enabled: categoryId !== null,
  });
}

function useTopicDetail(topicId: number | null) {
  return useQuery({
    queryKey: ["forum-topic", topicId],
    queryFn: async () => {
      const res = await fetch(`${API}/topics/${topicId}`);
      return res.json();
    },
    enabled: topicId !== null,
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function AdminCategoryPanel({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
      setName("");
      setDescription("");
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-card rounded-xl border border-[#3a9ca5]/20 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#3a9ca5]" />
            New Category
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
            size="sm"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Create Category
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryList({ onSelect, isAdmin }: { onSelect: (id: number) => void; isAdmin: boolean }) {
  const { data: categories, isLoading } = useCategories();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum-categories"] }),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: number; name: string; description: string }) => {
      const res = await fetch(`${API}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
      setEditingId(null);
    },
  });

  function startEditing(cat: any) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
  }

  function saveEdit() {
    if (!editingId || !editName.trim()) return;
    renameMutation.mutate({ id: editingId, name: editName.trim(), description: editDesc.trim() });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            <EditableText contentKey="community.heading" fallback="Discussion Forum" as="span" />
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] rounded-full mt-2" />
          <EditableText
            contentKey="community.subheading"
            fallback="Share ideas, ask questions, and connect with other educators."
            as="p"
            className="text-sm text-muted-foreground mt-2 max-w-xl"
          />
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreate(!showCreate)}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-[#3a9ca5]/30 text-[#3a9ca5]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <AdminCategoryPanel onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      {(!categories || categories.length === 0) ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-[#3a9ca5]/10">
          <Users className="w-12 h-12 text-[#3a9ca5]/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No forum categories yet.</p>
          {isAdmin && (
            <p className="text-sm text-muted-foreground">Create your first category to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat: any, index: number) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {editingId === cat.id ? (
                <div className="bg-card rounded-xl border-2 border-[#3a9ca5]/40 p-5">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Category Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveEdit}
                        disabled={!editName.trim() || renameMutation.isPending}
                        className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
                        size="sm"
                      >
                        {renameMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onSelect(cat.id)}
                  className="group w-full text-left bg-card rounded-xl border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/30 p-5 transition-all hover:shadow-md hover:shadow-[#3a9ca5]/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-[#3a9ca5] transition-colors mb-1">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{cat.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {cat.topicCount} {cat.topicCount === 1 ? "topic" : "topics"}
                        </span>
                        {cat.lastActivity && (
                          <span>Last active: {timeAgo(cat.lastActivity)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(cat);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-[#3a9ca5] hover:bg-[#3a9ca5]/10 transition-colors"
                            title="Edit category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this category and all its topics?")) {
                                deleteMutation.mutate(cat.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#3a9ca5] transition-colors" />
                    </div>
                  </div>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicList({
  categoryId,
  onBack,
  onSelectTopic,
  isAdmin,
}: {
  categoryId: number;
  onBack: () => void;
  onSelectTopic: (id: number) => void;
  isAdmin: boolean;
}) {
  const { data: topics, isLoading } = useTopics(categoryId);
  const { data: categories } = useCategories();
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const category = categories?.find((c: any) => c.id === categoryId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryId, title, content, authorName: authorName || user?.firstName }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topics", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
      setTitle("");
      setContent("");
      setAuthorName("");
      setShowNewTopic(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: boolean }) => {
      const res = await fetch(`${API}/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum-topics", categoryId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/topics/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topics", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-foreground">{category?.name || "Topics"}</h2>
          {category?.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
        <Button
          onClick={() => setShowNewTopic(!showNewTopic)}
          size="sm"
          className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Topic
        </Button>
      </div>

      <AnimatePresence>
        {showNewTopic && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-[#3a9ca5]/20 p-5 mb-6">
              <h3 className="font-semibold text-sm mb-4">Start a New Topic</h3>
              <div className="space-y-3">
                {!user && !isAdmin && (
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                  />
                )}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Topic title"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to discuss?"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!title.trim() || !content.trim() || createMutation.isPending}
                    className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
                    size="sm"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                    Post Topic
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowNewTopic(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
        </div>
      ) : !topics || topics.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-[#3a9ca5]/10">
          <MessageSquare className="w-10 h-10 text-[#3a9ca5]/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No topics yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic: any, index: number) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <button
                onClick={() => onSelectTopic(topic.id)}
                className={cn(
                  "group w-full text-left rounded-xl p-4 transition-all hover:shadow-sm",
                  topic.isPinned
                    ? "bg-[#3a9ca5]/[0.04] border border-[#3a9ca5]/20"
                    : "bg-card border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/25"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isPinned && <Pin className="w-3 h-3 text-[#3a9ca5]" />}
                      {topic.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-[#3a9ca5] transition-colors truncate">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{topic.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{topic.authorName}</span>
                      <span>{timeAgo(topic.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {topic.replyCount}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleMutation.mutate({ id: topic.id, field: "isPinned", value: !topic.isPinned })}
                        className={cn("p-1 rounded transition-colors", topic.isPinned ? "text-[#3a9ca5]" : "text-muted-foreground/40 hover:text-[#3a9ca5]")}
                        title={topic.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: topic.id, field: "isLocked", value: !topic.isLocked })}
                        className={cn("p-1 rounded transition-colors", topic.isLocked ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500")}
                        title={topic.isLocked ? "Unlock" : "Lock"}
                      >
                        <Lock className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this topic?")) deleteMutation.mutate(topic.id); }}
                        className="p-1 rounded text-muted-foreground/40 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicView({
  topicId,
  onBack,
  isAdmin,
}: {
  topicId: number;
  onBack: () => void;
  isAdmin: boolean;
}) {
  const { data, isLoading } = useTopicDetail(topicId);
  const [replyContent, setReplyContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topicId, content: replyContent, authorName: authorName || user?.firstName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topic", topicId] });
      setReplyContent("");
      setAuthorName("");
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/replies/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum-topic", topicId] }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  const { topic, replies } = data;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#3a9ca5] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to topics
      </button>

      <div className="bg-card rounded-xl border border-[#3a9ca5]/15 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          {topic.isPinned && <Pin className="w-3.5 h-3.5 text-[#3a9ca5]" />}
          {topic.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
          <h2 className="text-lg font-bold text-foreground">{topic.title}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="font-medium text-[#3a9ca5]">{topic.authorName}</span>
          <span>{timeAgo(topic.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
      </div>

      {replies.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h3>
          {replies.map((reply: any) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/30 rounded-lg p-4 border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">{reply.authorName}</span>
                  <span>{timeAgo(reply.createdAt)}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { if (confirm("Delete this reply?")) deleteReplyMutation.mutate(reply.id); }}
                    className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reply.content}</p>
            </motion.div>
          ))}
        </div>
      )}

      {topic.isLocked ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <Lock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-sm text-amber-700">This topic is locked. No new replies can be added.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-[#3a9ca5]/10 p-5">
          <h3 className="text-sm font-semibold mb-3">Post a Reply</h3>
          {!user && !isAdmin && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 mb-3"
            />
          )}
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-none mb-3"
          />
          <Button
            onClick={() => replyMutation.mutate()}
            disabled={!replyContent.trim() || replyMutation.isPending}
            className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
            size="sm"
          >
            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            Reply
          </Button>
          {replyMutation.isError && (
            <p className="text-red-500 text-xs mt-2">{(replyMutation.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const { data: isAdmin } = useAdminCheck();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const adminLoginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
    },
    onError: () => setAdminError("Invalid password"),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3a9ca5]">Community</h1>
              <div className="w-20 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mt-2" />
              <p className="text-muted-foreground mt-3 text-sm">
                Share ideas, ask questions, and connect with other music educators.
              </p>
            </div>
            {!isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminLogin(!showAdminLogin)}
                className="text-xs gap-1.5 text-muted-foreground/50 hover:text-muted-foreground"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Button>
            )}
          </div>

          {showAdminLogin && !isAdmin && (
            <div className="mb-6 bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Admin Login
                </div>
                <button onClick={() => { setShowAdminLogin(false); setAdminError(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); adminLoginMutation.mutate(adminPassword); }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  className="flex-grow px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                />
                <Button type="submit" size="sm" className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
                  Login
                </Button>
              </form>
              {adminError && <p className="text-red-500 text-xs mt-2">{adminError}</p>}
            </div>
          )}

          {isAdmin && (
            <div className="mb-4 bg-[#3a9ca5]/5 border border-[#3a9ca5]/20 rounded-xl px-4 py-3 text-sm text-[#3a9ca5]">
              <strong>Admin mode:</strong> You can create/delete categories, pin/lock topics, and delete replies.
            </div>
          )}

          {selectedTopic ? (
            <TopicView
              topicId={selectedTopic}
              onBack={() => setSelectedTopic(null)}
              isAdmin={!!isAdmin}
            />
          ) : selectedCategory ? (
            <TopicList
              categoryId={selectedCategory}
              onBack={() => setSelectedCategory(null)}
              onSelectTopic={setSelectedTopic}
              isAdmin={!!isAdmin}
            />
          ) : (
            <CategoryList
              onSelect={setSelectedCategory}
              isAdmin={!!isAdmin}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
