"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { Reveal, LikeBurst } from "@/components/motion";
import { shortAddress, formatSol } from "@/lib/utils";

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
  product_slug: string | null;
  product_title: string | null;
  product_price: number | null;
};

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

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
      <h1 className="font-display text-2xl font-bold">Feed</h1>
      <p className="mt-1 text-sm text-[var(--text-mut)]">
        What people are making and selling right now.
      </p>

      {user ? (
        <div className="mt-6 rounded-[var(--radius-md)] border p-4" style={{ background: "var(--surface)" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share something you made, or a slot you are opening up."
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--text-mut)]"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-mut)]">{text.length}/1000</span>
            <button
              onClick={publish}
              disabled={posting || !text.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
              style={{ background: "var(--brand-grad)" }}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-md)] border p-4 text-sm text-[var(--text-mut)]" style={{ background: "var(--surface)" }}>
          Connect a wallet to post and to react.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-[var(--text-mut)]">Loading the feed…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-[var(--text-mut)]">
            Your feed is quiet. Be the first to post something.
          </p>
        )}
        {posts.map((p, i) => (
          <Reveal key={p.id} dir="up" delay={Math.min(i * 0.04, 0.3)}>
            <PostCard post={p} canLike={!!user} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, canLike }: { post: Post; canLike: boolean }) {
  const [likes, setLikes] = useState(post.likes_count);
  const name = post.author_name || post.author_username || shortAddress(post.author_wallet);

  async function toggleLike() {
    if (!canLike) return;
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLikes(d.likes);
    }
  }

  return (
    <article className="rounded-[var(--radius-md)] border p-4" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-black"
          style={{ background: "var(--brand-grad)" }}
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium">{name}</div>
          <div className="font-mono text-xs text-[var(--text-mut)]">
            {shortAddress(post.author_wallet)}
          </div>
        </div>
      </div>
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
      <div className="mt-3 flex items-center gap-3 text-sm text-[var(--text-mut)]">
        <button onClick={toggleLike} className="flex items-center gap-2">
          <LikeBurst />
        </button>
        <span>{likes}</span>
      </div>
    </article>
  );
}
