CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  priority VARCHAR(10) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  assignee VARCHAR(50),
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(50),
  pinned BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL,
  detail TEXT,
  actor VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
