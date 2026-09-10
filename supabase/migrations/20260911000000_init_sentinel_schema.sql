-- Sentinel Runtime Supabase Migration
-- Project: sentinel-runtime (iudjmyuggwvvldakdjqt)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Principals table
CREATE TABLE IF NOT EXISTS principals (
  principal_id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  authorized_scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Policies table
CREATE TABLE IF NOT EXISTS policies (
  operation TEXT PRIMARY KEY,
  risk_level TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  principal_id TEXT,
  scenario TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  total_actions INT DEFAULT 0,
  peak_drift FLOAT DEFAULT 0.0
);

-- 4. Actions table
CREATE TABLE IF NOT EXISTS actions (
  action_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  principal_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resource_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  scope_required TEXT NOT NULL,
  target TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  risk_class TEXT NOT NULL DEFAULT 'read'
);

-- 5. Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  action_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  auth_ok BOOLEAN NOT NULL DEFAULT true,
  risk_class TEXT NOT NULL,
  drift_score FLOAT NOT NULL DEFAULT 0.0,
  requires_human_confirm BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  execution_latency_ms INT DEFAULT 10,
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

-- 6. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  action_id TEXT,
  principal_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  decision TEXT,
  reason TEXT,
  risk_class TEXT,
  target TEXT,
  operation TEXT,
  actor TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & realtime querying
CREATE INDEX IF NOT EXISTS idx_actions_session_id ON actions(session_id);
CREATE INDEX IF NOT EXISTS idx_actions_principal_id ON actions(principal_id);
CREATE INDEX IF NOT EXISTS idx_actions_timestamp ON actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_session_id ON decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_principal_id ON audit_logs(principal_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anon and authenticated
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'principals' AND policyname = 'Allow anon read principals') THEN
    CREATE POLICY "Allow anon read principals" ON principals FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'policies' AND policyname = 'Allow anon read policies') THEN
    CREATE POLICY "Allow anon read policies" ON policies FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow anon read sessions') THEN
    CREATE POLICY "Allow anon read sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actions' AND policyname = 'Allow anon read actions') THEN
    CREATE POLICY "Allow anon read actions" ON actions FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decisions' AND policyname = 'Allow anon read decisions') THEN
    CREATE POLICY "Allow anon read decisions" ON decisions FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow anon read audit_logs') THEN
    CREATE POLICY "Allow anon read audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'principals' AND policyname = 'Allow anon write principals') THEN
    CREATE POLICY "Allow anon write principals" ON principals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'policies' AND policyname = 'Allow anon write policies') THEN
    CREATE POLICY "Allow anon write policies" ON policies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow anon write sessions') THEN
    CREATE POLICY "Allow anon write sessions" ON sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actions' AND policyname = 'Allow anon write actions') THEN
    CREATE POLICY "Allow anon write actions" ON actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decisions' AND policyname = 'Allow anon write decisions') THEN
    CREATE POLICY "Allow anon write decisions" ON decisions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow anon write audit_logs') THEN
    CREATE POLICY "Allow anon write audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE actions;
ALTER PUBLICATION supabase_realtime ADD TABLE decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
