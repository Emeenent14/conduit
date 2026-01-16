-- FlowMatic Database Schema
-- PostgreSQL 15+

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE auth_type AS ENUM ('oauth2', 'api_key');
CREATE TYPE workflow_status AS ENUM ('active', 'inactive', 'error', 'pending');
CREATE TYPE execution_status AS ENUM ('running', 'success', 'error', 'waiting', 'cancelled');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth
    
    -- Settings
    notification_email BOOLEAN DEFAULT TRUE,
    notification_slack BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Hashed token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Device tracking (optional)
    user_agent TEXT,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name (e.g., 'users', 'megaphone')
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================
-- APPS TABLE (Integration providers)
-- ============================================
CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'slack', 'google-sheets'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    auth_type auth_type NOT NULL,
    
    -- OAuth configuration (if oauth2)
    oauth_scopes TEXT[], -- Required scopes
    oauth_auth_url TEXT,
    oauth_token_url TEXT,
    
    -- API key configuration (if api_key)
    api_key_instructions TEXT, -- Markdown instructions
    api_key_url TEXT, -- Link to where user gets the key
    
    -- n8n credential type mapping
    n8n_credential_type VARCHAR(100), -- e.g., 'slackOAuth2Api'
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_apps_slug ON apps(slug);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT, -- Markdown content
    
    -- Classification
    category_id UUID NOT NULL REFERENCES categories(id),
    tags TEXT[] DEFAULT '{}',
    
    -- Template configuration
    required_app_ids UUID[] NOT NULL, -- Array of app IDs
    config_fields JSONB DEFAULT '[]', -- Array of config field definitions
    
    -- n8n workflow
    n8n_workflow JSONB NOT NULL, -- Full n8n workflow JSON with placeholders
    
    -- Metadata
    estimated_setup_minutes INTEGER DEFAULT 5,
    popularity INTEGER DEFAULT 0, -- Number of activations
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_popularity ON templates(popularity DESC);
CREATE INDEX idx_templates_featured ON templates(is_featured) WHERE is_featured = TRUE;

-- Full-text search index
CREATE INDEX idx_templates_search ON templates 
    USING GIN (to_tsvector('english', name || ' ' || description));

-- ============================================
-- CREDENTIALS TABLE
-- ============================================
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES apps(id),
    
    -- Encrypted credential data
    credentials_encrypted BYTEA NOT NULL, -- AES-256-GCM encrypted JSON
    encryption_iv BYTEA NOT NULL, -- Initialization vector
    auth_tag BYTEA NOT NULL, -- GCM auth tag
    
    -- OAuth-specific fields (stored separately for token refresh)
    oauth_access_token_encrypted BYTEA,
    oauth_refresh_token_encrypted BYTEA,
    oauth_expires_at TIMESTAMP WITH TIME ZONE,
    oauth_scopes TEXT[],
    
    -- Status
    is_valid BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMP WITH TIME ZONE,
    validation_error TEXT,
    
    -- n8n credential ID (after synced to n8n)
    n8n_credential_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One credential per app per user
    UNIQUE(user_id, app_id)
);

CREATE INDEX idx_credentials_user ON credentials(user_id);
CREATE INDEX idx_credentials_app ON credentials(app_id);

-- ============================================
-- USER WORKFLOWS TABLE
-- ============================================
CREATE TABLE user_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id),
    
    -- Workflow info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Configuration
    config_values JSONB DEFAULT '{}', -- User's config field values
    
    -- n8n sync
    n8n_workflow_id VARCHAR(100), -- n8n's workflow ID
    n8n_workflow_data JSONB, -- Full workflow JSON as deployed
    
    -- Status
    status workflow_status DEFAULT 'inactive',
    is_active BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    deactivated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_workflows_user ON user_workflows(user_id);
CREATE INDEX idx_user_workflows_template ON user_workflows(template_id);
CREATE INDEX idx_user_workflows_status ON user_workflows(status);
CREATE INDEX idx_user_workflows_active ON user_workflows(is_active) WHERE is_active = TRUE;

-- ============================================
-- WORKFLOW CREDENTIAL MAPPINGS TABLE
-- ============================================
CREATE TABLE workflow_credential_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_workflow_id UUID NOT NULL REFERENCES user_workflows(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    
    -- Which app slot this credential fills
    app_slug VARCHAR(100) NOT NULL,
    
    -- n8n node reference
    n8n_node_name VARCHAR(200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One credential per app per workflow
    UNIQUE(user_workflow_id, app_slug)
);

CREATE INDEX idx_wcm_workflow ON workflow_credential_mappings(user_workflow_id);
CREATE INDEX idx_wcm_credential ON workflow_credential_mappings(credential_id);

-- ============================================
-- EXECUTIONS TABLE
-- ============================================
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_workflow_id UUID NOT NULL REFERENCES user_workflows(id) ON DELETE CASCADE,
    
    -- n8n execution reference
    n8n_execution_id VARCHAR(100),
    
    -- Status
    status execution_status NOT NULL DEFAULT 'running',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER, -- Execution duration in milliseconds
    
    -- Data (optional, can be large)
    input_data JSONB,
    output_data JSONB,
    
    -- Error info
    error_message TEXT,
    error_node VARCHAR(200), -- Which node failed
    error_code VARCHAR(100),
    
    -- Metadata
    is_test_run BOOLEAN DEFAULT FALSE,
    trigger_type VARCHAR(50), -- 'webhook', 'schedule', 'manual'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow ON executions(user_workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started ON executions(started_at DESC);
CREATE INDEX idx_executions_n8n ON executions(n8n_execution_id);

-- Partial index for recent executions (last 30 days)
CREATE INDEX idx_executions_recent ON executions(user_workflow_id, started_at DESC) 
    WHERE started_at > NOW() - INTERVAL '30 days';

-- ============================================
-- WORKFLOW STATISTICS TABLE (Materialized)
-- ============================================
CREATE TABLE workflow_statistics (
    user_workflow_id UUID PRIMARY KEY REFERENCES user_workflows(id) ON DELETE CASCADE,
    
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    last_execution_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    
    avg_duration_ms INTEGER,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG TABLE (Optional)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- e.g., 'workflow.activated', 'credential.created'
    resource_type VARCHAR(50), -- e.g., 'workflow', 'credential'
    resource_id UUID,
    
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment template popularity
CREATE OR REPLACE FUNCTION increment_template_popularity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates 
    SET popularity = popularity + 1 
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow statistics
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workflow_statistics (user_workflow_id, total_executions, successful_executions, failed_executions, last_execution_at, last_success_at, last_failure_at)
    VALUES (
        NEW.user_workflow_id,
        1,
        CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
        NEW.started_at,
        CASE WHEN NEW.status = 'success' THEN NEW.finished_at ELSE NULL END,
        CASE WHEN NEW.status = 'error' THEN NEW.finished_at ELSE NULL END
    )
    ON CONFLICT (user_workflow_id) DO UPDATE SET
        total_executions = workflow_statistics.total_executions + 1,
        successful_executions = workflow_statistics.successful_executions + 
            CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
        failed_executions = workflow_statistics.failed_executions + 
            CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
        last_execution_at = NEW.started_at,
        last_success_at = CASE 
            WHEN NEW.status = 'success' THEN NEW.finished_at 
            ELSE workflow_statistics.last_success_at 
        END,
        last_failure_at = CASE 
            WHEN NEW.status = 'error' THEN NEW.finished_at 
            ELSE workflow_statistics.last_failure_at 
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_credentials_updated_at
    BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_workflows_updated_at
    BEFORE UPDATE ON user_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment popularity on workflow creation
CREATE TRIGGER increment_popularity_on_workflow
    AFTER INSERT ON user_workflows
    FOR EACH ROW EXECUTE FUNCTION increment_template_popularity();

-- Update statistics on execution complete
CREATE TRIGGER update_stats_on_execution
    AFTER INSERT OR UPDATE OF status ON executions
    FOR EACH ROW
    WHEN (NEW.status IN ('success', 'error'))
    EXECUTE FUNCTION update_workflow_stats();

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
    ('lead-management', 'Lead Management', 'Capture and manage leads automatically', 'users', 1),
    ('marketing', 'Marketing', 'Automate your marketing workflows', 'megaphone', 2),
    ('sales', 'Sales', 'Streamline your sales process', 'dollar-sign', 3),
    ('operations', 'Operations', 'Operational automation', 'settings', 4),
    ('support', 'Customer Support', 'Support ticket automation', 'headphones', 5),
    ('productivity', 'Productivity', 'Personal productivity automations', 'zap', 6);

-- ============================================
-- SEED DATA: Apps
-- ============================================
INSERT INTO apps (slug, name, description, icon_url, auth_type, n8n_credential_type, oauth_scopes) VALUES
    ('slack', 'Slack', 'Team messaging and notifications', '/icons/slack.svg', 'oauth2', 'slackOAuth2Api', ARRAY['chat:write', 'channels:read', 'users:read']),
    ('google-sheets', 'Google Sheets', 'Spreadsheet automation', '/icons/google-sheets.svg', 'oauth2', 'googleSheetsOAuth2Api', ARRAY['https://www.googleapis.com/auth/spreadsheets']),
    ('gmail', 'Gmail', 'Email automation', '/icons/gmail.svg', 'oauth2', 'gmailOAuth2', ARRAY['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']),
    ('google-calendar', 'Google Calendar', 'Calendar management', '/icons/google-calendar.svg', 'oauth2', 'googleCalendarOAuth2Api', ARRAY['https://www.googleapis.com/auth/calendar']),
    ('hubspot', 'HubSpot', 'CRM and marketing', '/icons/hubspot.svg', 'oauth2', 'hubspotOAuth2Api', ARRAY['crm.objects.contacts.read', 'crm.objects.contacts.write']);

INSERT INTO apps (slug, name, description, icon_url, auth_type, n8n_credential_type, api_key_instructions, api_key_url) VALUES
    ('openai', 'OpenAI', 'AI and GPT integration', '/icons/openai.svg', 'api_key', 'openAiApi', '1. Go to platform.openai.com\n2. Click on API Keys\n3. Create new secret key\n4. Copy and paste here', 'https://platform.openai.com/api-keys'),
    ('typeform', 'Typeform', 'Form and survey responses', '/icons/typeform.svg', 'api_key', 'typeformApi', '1. Go to your Typeform account\n2. Click Settings → Personal tokens\n3. Generate a new token\n4. Copy and paste here', 'https://admin.typeform.com/user/tokens'),
    ('mailchimp', 'Mailchimp', 'Email marketing', '/icons/mailchimp.svg', 'api_key', 'mailchimpApi', '1. Go to Mailchimp\n2. Account → Extras → API keys\n3. Create a key\n4. Copy and paste here', 'https://admin.mailchimp.com/account/api/'),
    ('stripe', 'Stripe', 'Payment processing', '/icons/stripe.svg', 'api_key', 'stripeApi', '1. Go to Stripe Dashboard\n2. Developers → API keys\n3. Copy your Secret key\n4. Paste here', 'https://dashboard.stripe.com/apikeys'),
    ('notion', 'Notion', 'Notes and databases', '/icons/notion.svg', 'api_key', 'notionApi', '1. Go to notion.so/my-integrations\n2. Create new integration\n3. Copy the Internal Integration Token\n4. Paste here', 'https://www.notion.so/my-integrations');
