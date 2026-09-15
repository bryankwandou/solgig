"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { formatSol, shortAddress } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem, HoverTilt } from "@/components/motion";
import { useCopy } from "@/lib/i18n";

type Profile = {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  is_verified: boolean;
  reputation_score: number;
  completed_orders: number;
  followers_count: number;
  following_count: number;
  created_at: string;
};
type ProfileProduct = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  price_lamports: number;
  rating_average: number;
  rating_count: number;
  total_purchases: number;
};
type ProfileService = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  price_lamports: number;
  delivery_days: number;
  total_orders: number;
};
type ProfilePost = {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const t = useCopy().pages;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<ProfileProduct[]>([]);
  const [services, setServices] = useState<ProfileService[]>([]);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${handle}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile ?? null);
        setProducts(d.products ?? []);
        setServices(d.services ?? []);
        setPosts(d.posts ?? []);
        setIsFollowing(!!d.isFollowing);
        setIsSelf(!!d.isSelf);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  async function toggleFollow() {
    if (!profile) return;
    const res = await fetch(`/api/users/${profile.id}/follow`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setIsFollowing(d.following);
      setProfile((p) => (p ? { ...p, followers_count: d.followers } : p));
    }
  }

  if (loading) return <p className="text-sm text-[var(--text-mut)]">{t.common.loading}</p>;
  if (!profile)
    return (
      <p className="text-sm text-[var(--text-mut)]">
        {t.profile.notFound}
      </p>
    );

  const name =
    profile.display_name || profile.username || shortAddress(profile.wallet_address);

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="grid h-16 w-16 place-items-center rounded-full text-2xl font-bold text-black"
                style={{ background: "var(--brand-grad)" }}
              >
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold">{name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-mut)]">
                <span className="font-mono">{shortAddress(profile.wallet_address)}</span>
                <span>·</span>
                <span>{t.profile.followers(profile.followers_count)}</span>
                <span>·</span>
                <span>{t.profile.following(profile.following_count)}</span>
                <span>·</span>
                <span>{t.profile.ordersDone(profile.completed_orders)}</span>
              </div>
            </div>
          </div>
          {user && !isSelf && (
            <button
              onClick={toggleFollow}
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={
                isFollowing
                  ? { border: "1px solid var(--border)", color: "var(--text-mut)" }
                  : { background: "var(--brand-grad)", color: "#000" }
              }
            >
              {isFollowing ? t.profile.followingBtn : t.profile.follow}
            </button>
          )}
        </div>
        {profile.bio && (
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-mut)]">
            {profile.bio}
          </p>
        )}
        {profile.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-full border px-2.5 py-0.5 text-xs text-[var(--text-mut)]">
                {s}
              </span>
            ))}
          </div>
        )}
      </Reveal>

      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">{t.profile.products}</h2>
          <Stagger className="mt-4 grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <StaggerItem key={p.id}>
                <HoverTilt>
                  <Link
                    href={`/marketplace/${p.slug}`}
                    className="block rounded-[var(--radius-md)] border p-4"
                    style={{ background: "var(--surface)" }}
                  >
                    {p.thumbnail_url && (
                      <img
                        src={p.thumbnail_url}
                        alt={p.title}
                        className="mb-3 h-24 w-full rounded-[var(--radius-sm)] object-cover"
                      />
                    )}
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-mut)]">
                      <span>{t.common.sold(p.total_purchases)}</span>
                      <span className="font-medium text-grad">
                        {formatSol(p.price_lamports)}
                      </span>
                    </div>
                  </Link>
                </HoverTilt>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {services.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">{t.profile.services}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-[var(--radius-md)] border p-4"
                style={{ background: "var(--surface)" }}
              >
                {s.thumbnail_url && (
                  <img
                    src={s.thumbnail_url}
                    alt={s.title}
                    className="mb-3 h-24 w-full rounded-[var(--radius-sm)] object-cover"
                  />
                )}
                <div className="text-sm font-medium">{s.title}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-mut)]">
                  <span>{t.common.delivery(s.delivery_days)}</span>
                  <span className="font-medium text-grad">
                    {formatSol(s.price_lamports)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">{t.profile.posts}</h2>
          <div className="mt-4 space-y-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className="rounded-[var(--radius-md)] border p-4"
                style={{ background: "var(--surface)" }}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>
                <div className="mt-2 text-xs text-[var(--text-mut)]">
                  {t.profile.likes(p.likes_count)} · {t.profile.comments(p.comments_count)} ·{" "}
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
