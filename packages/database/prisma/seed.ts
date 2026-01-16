import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Seed Categories
  // ============================================
  console.log('📁 Seeding categories...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'lead-management' },
      update: {},
      create: {
        slug: 'lead-management',
        name: 'Lead Management',
        description: 'Capture and manage leads automatically',
        icon: 'users',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'marketing' },
      update: {},
      create: {
        slug: 'marketing',
        name: 'Marketing',
        description: 'Automate your marketing workflows',
        icon: 'megaphone',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sales' },
      update: {},
      create: {
        slug: 'sales',
        name: 'Sales',
        description: 'Streamline your sales process',
        icon: 'dollar-sign',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'operations' },
      update: {},
      create: {
        slug: 'operations',
        name: 'Operations',
        description: 'Operational automation',
        icon: 'settings',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'support' },
      update: {},
      create: {
        slug: 'support',
        name: 'Customer Support',
        description: 'Support ticket automation',
        icon: 'headphones',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'productivity' },
      update: {},
      create: {
        slug: 'productivity',
        name: 'Productivity',
        description: 'Personal productivity automations',
        icon: 'zap',
        sortOrder: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // ============================================
  // Seed Apps (Integration Providers)
  // ============================================
  console.log('🔌 Seeding apps...');

  const apps = await Promise.all([
    // OAuth Apps
    prisma.app.upsert({
      where: { slug: 'slack' },
      update: {},
      create: {
        slug: 'slack',
        name: 'Slack',
        description: 'Team messaging and notifications',
        iconUrl: '/icons/slack.svg',
        authType: 'oauth2',
        n8nCredentialType: 'slackOAuth2Api',
        oauthScopes: ['chat:write', 'channels:read', 'users:read'],
      },
    }),
    prisma.app.upsert({
      where: { slug: 'google-sheets' },
      update: {},
      create: {
        slug: 'google-sheets',
        name: 'Google Sheets',
        description: 'Spreadsheet automation',
        iconUrl: '/icons/google-sheets.svg',
        authType: 'oauth2',
        n8nCredentialType: 'googleSheetsOAuth2Api',
        oauthScopes: ['https://www.googleapis.com/auth/spreadsheets'],
      },
    }),
    prisma.app.upsert({
      where: { slug: 'gmail' },
      update: {},
      create: {
        slug: 'gmail',
        name: 'Gmail',
        description: 'Email automation',
        iconUrl: '/icons/gmail.svg',
        authType: 'oauth2',
        n8nCredentialType: 'gmailOAuth2',
        oauthScopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
        ],
      },
    }),
    prisma.app.upsert({
      where: { slug: 'hubspot' },
      update: {},
      create: {
        slug: 'hubspot',
        name: 'HubSpot',
        description: 'CRM and marketing automation',
        iconUrl: '/icons/hubspot.svg',
        authType: 'oauth2',
        n8nCredentialType: 'hubspotOAuth2Api',
        oauthScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
      },
    }),

    // API Key Apps
    prisma.app.upsert({
      where: { slug: 'typeform' },
      update: {},
      create: {
        slug: 'typeform',
        name: 'Typeform',
        description: 'Form and survey responses',
        iconUrl: '/icons/typeform.svg',
        authType: 'api_key',
        n8nCredentialType: 'typeformApi',
        apiKeyInstructions:
          '1. Go to your Typeform account\n2. Click Settings → Personal tokens\n3. Generate a new token\n4. Copy and paste here',
        apiKeyUrl: 'https://admin.typeform.com/user/tokens',
      },
    }),
    prisma.app.upsert({
      where: { slug: 'openai' },
      update: {},
      create: {
        slug: 'openai',
        name: 'OpenAI',
        description: 'AI and GPT integration',
        iconUrl: '/icons/openai.svg',
        authType: 'api_key',
        n8nCredentialType: 'openAiApi',
        apiKeyInstructions:
          '1. Go to platform.openai.com\n2. Click on API Keys\n3. Create new secret key\n4. Copy and paste here',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
      },
    }),
    prisma.app.upsert({
      where: { slug: 'mailchimp' },
      update: {},
      create: {
        slug: 'mailchimp',
        name: 'Mailchimp',
        description: 'Email marketing',
        iconUrl: '/icons/mailchimp.svg',
        authType: 'api_key',
        n8nCredentialType: 'mailchimpApi',
        apiKeyInstructions:
          '1. Go to Mailchimp\n2. Account → Extras → API keys\n3. Create a key\n4. Copy and paste here',
        apiKeyUrl: 'https://admin.mailchimp.com/account/api/',
      },
    }),
    prisma.app.upsert({
      where: { slug: 'stripe' },
      update: {},
      create: {
        slug: 'stripe',
        name: 'Stripe',
        description: 'Payment processing',
        iconUrl: '/icons/stripe.svg',
        authType: 'api_key',
        n8nCredentialType: 'stripeApi',
        apiKeyInstructions:
          '1. Go to Stripe Dashboard\n2. Developers → API keys\n3. Copy your Secret key\n4. Paste here',
        apiKeyUrl: 'https://dashboard.stripe.com/apikeys',
      },
    }),
    prisma.app.upsert({
      where: { slug: 'notion' },
      update: {},
      create: {
        slug: 'notion',
        name: 'Notion',
        description: 'Notes and databases',
        iconUrl: '/icons/notion.svg',
        authType: 'api_key',
        n8nCredentialType: 'notionApi',
        apiKeyInstructions:
          '1. Go to notion.so/my-integrations\n2. Create new integration\n3. Copy the Internal Integration Token\n4. Paste here',
        apiKeyUrl: 'https://www.notion.so/my-integrations',
      },
    }),
  ]);

  console.log(`✅ Created ${apps.length} apps`);

  // ============================================
  // Seed Sample Template
  // ============================================
  console.log('📋 Seeding templates...');

  const leadCategory = categories.find((c) => c.slug === 'lead-management');
  const slackApp = apps.find((a) => a.slug === 'slack');
  const typeformApp = apps.find((a) => a.slug === 'typeform');

  if (leadCategory && slackApp && typeformApp) {
    await prisma.template.upsert({
      where: { slug: 'lead-to-slack-notification' },
      update: {},
      create: {
        slug: 'lead-to-slack-notification',
        name: 'New Lead → Slack Notification',
        description:
          'Get instant Slack notifications when a new lead submits your Typeform',
        longDescription: `## How This Works

This automation monitors your Typeform for new submissions and instantly sends a formatted notification to your chosen Slack channel.

### What You'll Get

- **Real-time alerts**: Know about new leads within seconds
- **Formatted messages**: Clean, easy-to-read lead information
- **Customizable channel**: Send to any Slack channel you choose

### Perfect For

- Sales teams wanting instant lead notifications
- Small businesses that need quick follow-up
- Anyone using Typeform for lead capture`,
        categoryId: leadCategory.id,
        tags: ['leads', 'notifications', 'real-time', 'sales'],
        requiredAppIds: [typeformApp.id, slackApp.id],
        configFields: [
          {
            id: 'slack_channel',
            type: 'text',
            label: 'Slack Channel',
            placeholder: '#leads',
            required: true,
            helpText: 'The channel where lead notifications will be posted',
          },
          {
            id: 'notification_emoji',
            type: 'select',
            label: 'Notification Emoji',
            default: '🔔',
            options: [
              { value: '🔔', label: '🔔 Bell' },
              { value: '🎯', label: '🎯 Target' },
              { value: '⚡', label: '⚡ Lightning' },
              { value: '🚀', label: '🚀 Rocket' },
            ],
          },
        ],
        n8nWorkflow: {
          name: '{{WORKFLOW_NAME}}',
          nodes: [
            {
              name: 'Typeform Trigger',
              type: 'n8n-nodes-base.typeformTrigger',
              typeVersion: 1,
              position: [250, 300],
              credentials: {
                typeformApi: '{{CREDENTIAL:typeform}}',
              },
            },
            {
              name: 'Slack',
              type: 'n8n-nodes-base.slack',
              typeVersion: 2,
              position: [500, 300],
              parameters: {
                channel: '{{CONFIG:slack_channel}}',
                text: '{{CONFIG:notification_emoji}} New Lead!',
              },
              credentials: {
                slackOAuth2Api: '{{CREDENTIAL:slack}}',
              },
            },
          ],
          connections: {
            'Typeform Trigger': {
              main: [[{ node: 'Slack', type: 'main', index: 0 }]],
            },
          },
        },
        estimatedSetupMinutes: 5,
        popularity: 0,
        isFeatured: true,
      },
    });

    console.log('✅ Created sample template');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
