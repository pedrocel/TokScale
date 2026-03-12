-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id TEXT REFERENCES workspaces(id),
    user_id TEXT REFERENCES users(id),
    role TEXT DEFAULT 'admin',
    PRIMARY KEY (workspace_id, user_id)
);

-- TikTok Connections
CREATE TABLE IF NOT EXISTS tiktok_connections (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id),
    status TEXT DEFAULT 'active',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ad Accounts
CREATE TABLE IF NOT EXISTS ad_accounts (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id),
    connection_id TEXT REFERENCES tiktok_connections(id),
    external_account_id TEXT NOT NULL,
    name TEXT,
    status TEXT,
    last_synced_at DATETIME
);

-- Publish Jobs
CREATE TABLE IF NOT EXISTS publish_jobs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id),
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    campaign_data TEXT NOT NULL, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME
);

-- Publish Job Items (um por conta de anúncio)
CREATE TABLE IF NOT EXISTS publish_job_items (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES publish_jobs(id),
    ad_account_id TEXT REFERENCES ad_accounts(id),
    status TEXT DEFAULT 'pending', -- pending, processing, success, error
    error_message TEXT,
    external_campaign_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME
);

-- TikTok Pixels
CREATE TABLE IF NOT EXISTS tiktok_pixels (
    id TEXT PRIMARY KEY,
    ad_account_id TEXT REFERENCES ad_accounts(id),
    external_pixel_id TEXT NOT NULL,
    name TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME
);
