-- SolGig schema for Neon Postgres.
-- Access control is enforced in the server layer (SIWS session -> user id),
-- not through database RLS, since Neon has no Supabase auth context.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  reputation_score INTEGER DEFAULT 0,
  total_earned_lamports BIGINT DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- =========================================
-- SIWS NONCES (single use, short lived)
-- =========================================
CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false
);

-- =========================================
-- FOLLOWS
-- =========================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- =========================================
-- PRODUCTS (digital goods)
-- =========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  thumbnail_url TEXT,
  product_type TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  price_lamports BIGINT NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  total_purchases INTEGER DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published, created_at DESC);

-- =========================================
-- SERVICES (freelance gigs)
-- =========================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  price_lamports BIGINT NOT NULL DEFAULT 0,
  delivery_days INTEGER DEFAULT 3,
  revisions INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT true,
  total_orders INTEGER DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_seller ON services(seller_id);

-- =========================================
-- POSTS (social feed)
-- =========================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  linked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'product',
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  amount_lamports BIGINT NOT NULL,
  platform_fee_lamports BIGINT DEFAULT 0,
  token_mint TEXT NOT NULL DEFAULT 'SOL',
  payment_tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  buyer_wallet TEXT,
  seller_wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- Escrow support for service orders (safe to re-run).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_tx_signature TEXT;
-- When the current payout attempt was signed; a stale 'releasing' order can
-- only be retried once its blockhash has certainly expired.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_started_at TIMESTAMPTZ;

-- =========================================
-- TRANSACTIONS (mirror of on-chain payments)
-- =========================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  token_mint TEXT DEFAULT 'SOL',
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at DESC);

-- =========================================
-- SUPPORTING INDEXES for hot query paths
-- =========================================
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_services_published ON services(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nonces_expiry ON auth_nonces(expires_at);

-- =========================================
-- ROUND 3: server-side session revocation and shared rate limits
-- =========================================
-- Every session token carries the user's session_version. Logout bumps it,
-- which invalidates every token issued before (all devices).
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- Fixed-window request counters shared by all serverless instances.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- =========================================
-- ROUND 4: on-chain settlement through the escrow program
-- =========================================
-- How an order's money moves: 'transfer' (buyer pays seller and treasury
-- directly), 'custodial' (platform escrow wallet), or 'program' (the
-- solgig-escrow program: receipts for goods, program-owned escrow for
-- services).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS settlement TEXT NOT NULL DEFAULT 'transfer';
UPDATE orders SET settlement = 'custodial' WHERE escrow = true AND settlement = 'transfer';
