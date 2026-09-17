"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { Reveal, LikeBurst } from "@/components/motion";
import { shortAddress, formatSol } from "@/lib/utils";
import { useCopy } from "@/lib/i18n";

type Post = {
  id: string;
  content: string;
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_username: string | null;
  author_name: string | null;
  author_wallet: string;
  author_avatar: string | null;
  product_slug: string | null;
  product_title: string | null;
  product_price: number | null;
};

export default function FeedPage() {
  const { user } = useAuth();
  const t = useCopy().pages;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.items ?? []);
        setCursor(d.nextCursor ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await fetch(`/api/posts?cursor=${encodeURIComponent(cursor)}`).then(
        (r) => r.json(),
      );
      setPosts((prev) => [...prev, ...(d.items ?? [])]);
      setCursor(d.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => load(), [load]);

  async function publish() {
    if (!text.trim()) return;
    setPosting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    setPosting(false);
    if (res.ok) {
      setText("");
      load();
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">{t.feed.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        {t.feed.sub}
      </p>

      {user ? (
        <div className="mt-6 rounded-[var(--radius-md)] border p-4" style={{ background: "var(--surface)" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={t.feed.placeholder}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--text-mut)]"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-mut)]">{text.length}/1000</span>
            <button
              onClick={publish}
              disabled={posting || !text.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--on-brand)] disabled:opacity-40"
              style={{ background: "var(--brand-grad)" }}
            >
              {posting ? t.feed.posting : t.feed.post}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-md)] border p-4 text-sm text-[var(--text-mut)]" style={{ background: "var(--surface)" }}>
          {t.feed.connect}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-[var(--text-mut)]">{t.feed.loading}</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-[var(--text-mut)]">
            {t.feed.empty}
          </p>
        )}
        {posts.map((p, i) => (
          <Reveal key={p.id} dir="up" delay={Math.min(i * 0.04, 0.3)}>
            <PostCard post={p} canLike={!!user} />
          </Reveal>
        ))}
        {cursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-full border py-2.5 text-sm text-[var(--text-mut)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
          >
            {loadingMore ? t.common.loading : t.common.loadMore}
          </button>
        )}
      </div>
    </div>
  );
}

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_username: string | null;
  author_name: string | null;
  author_wallet: string;
};

function PostCard({ post, canLike }: { post: Post; canLike: boolean }) {
  const t = useCopy().pages;
  const [likes, setLikes] = useState(post.likes_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const name = post.author_name || post.author_username || shortAddress(post.author_wallet);
  const handle = post.author_username || post.author_wallet;

  async function toggleLike() {
    if (!canLike) return;
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLikes(d.likes);
    }
  }

  async function openComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0 && commentCount > 0) {
      const d = await fetch(`/api/posts/${post.id}/comments`).then((r) => r.json());
      setComments(d.items ?? []);
    }
  }

  async function sendComment() {
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments((prev) => [...prev, d.comment]);
        setCommentCount((c) => c + 1);
        setCommentText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-md)] border p-4" style={{ background: "var(--surface)" }}>
      <a href={`/u/${handle}`} className="flex items-center gap-3">
        {post.author_avatar ? (
          <img
            src={post.author_avatar}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-[var(--on-brand)]"
            style={{ background: "var(--brand-grad)" }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="leading-tight">
          <div className="text-sm font-medium hover:underline">{name}</div>
          <div className="font-mono text-xs text-[var(--text-mut)]">
            {shortAddress(post.author_wallet)}
          </div>
        </div>
      </a>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
      {post.product_slug && (
        <a
          href={`/marketplace/${post.product_slug}`}
          className="mt-3 flex items-center justify-between rounded-[var(--radius-sm)] border p-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
        >
          <span>{post.product_title}</span>
          <span className="font-medium text-grad">
            {post.product_price != null ? formatSol(post.product_price) : ""}
          </span>
        </a>
      )}
      <div className="mt-3 flex items-center gap-4 text-sm text-[var(--text-mut)]">
        <span className="flex items-center gap-2">
          <button onClick={toggleLike} className="flex items-center gap-2">
            <LikeBurst />
          </button>
          {likes}
        </span>
        <button onClick={openComments} className="hover:text-[var(--text)]">
          {t.feed.comments(commentCount)}
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-3 border-t pt-3">
          {comments.map((c) => {
            const cname =
              c.author_name || c.author_username || shortAddress(c.author_wallet);
            return (
              <div key={c.id} className="mt-2 text-sm">
                <a
                  href={`/u/${c.author_username || c.author_wallet}`}
                  className="font-medium hover:underline"
                >
                  {cname}
                </a>{" "}
                <span className="text-[var(--text-mut)]">{c.content}</span>
              </div>
            );
          })}
          {canLike ? (
            <div className="mt-3 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                maxLength={500}
                placeholder={t.feed.addComment}
                className="flex-1 rounded-full border bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-mut)]"
              />
              <button
                onClick={sendComment}
                disabled={sending || !commentText.trim()}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-[var(--on-brand)] disabled:opacity-40"
                style={{ background: "var(--brand-grad)" }}
              >
                {t.common.send}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-mut)]">
              {t.feed.joinConvo}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
