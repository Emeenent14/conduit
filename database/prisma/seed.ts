/**
 * Conduit - Database Seed Script
 * 
 * Seeds initial data: categories, apps, and sample templates
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// Categories
// ============================================

const categories = [
  {
    slug: 'lead-management',
    name: 'Lead Management',
    description: 'Capture, notify, and manage leads automatically',
    icon: 'users',
    sortOrder: 1,
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    description: 'Automate your marketing workflows',
    icon: 'megaphone',
    sortOrder: 2,
  },
  {
    slug: 'sales',
    name: 'Sales',
    description: 'Streamline your sales process',
    icon: 'dollar-sign',
    sortOrder: 3,
  },
  {
    slug: 'operations',
    name: 'Operations',
    description: 'Operational and business automation',
    icon: 'settings',
    sortOrder: 4,
  },
  {
    slug: 'support',
    name: 'Customer Support',
    description: 'Support ticket and customer service automation',
    icon: 'headphones',
    sortOrder: 5,
  },
  {
    slug: 'productivity',
    name: 'Productivity',
    description: 'Personal and team productivity automations',
    icon: 'zap',
    sortOrder: 6,
  },
];

// ============================================
// Apps (Integration Providers)
// ============================================

const apps = [
  // OAuth Apps
  {
    slug: 'slack',
    name: 'Slack',
    description: 'Team messaging and notifications',
    iconUrl: '/icons/slack.svg',
    authType: 'oauth2' as const,
    n8nCredentialType: 'slackOAuth2Api',
    oauthScopes: ['chat:write', 'channels:read', 'users:read'],
  },
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    description: 'Spreadsheet automation',
    iconUrl: '/icons/google-sheets.svg',
    authType: 'oauth2' as const,
    n8nCredentialType: 'googleSheetsOAuth2Api',
    oauthScopes: ['https://www.googleapis.com/auth/spreadsheets'],
  },
  {
    slug: 'gmail',
    name: 'Gmail',
    description: 'Email automation',
    iconUrl: '/icons/gmail.svg',
    authType: 'oauth2' as const,
    n8nCredentialType: 'gmailOAuth2',
    oauthScopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar management',
    iconUrl: '/icons/google-calendar.svg',
    authType: 'oauth2' as const,
    n8nCredentialType: 'googleCalendarOAuth2Api',
    oauthScopes: ['https://www.googleapis.com/auth/calendar'],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    iconUrl: '/icons/hubspot.svg',
    authType: 'oauth2' as const,
    n8nCredentialType: 'hubspotOAuth2Api',
    oauthScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read'],
  },
  // API Key Apps
  {
    slug: 'typeform',
    name: 'Typeform',
    description: 'Form and survey responses',
    iconUrl: '/icons/typeform.svg',
    authType: 'api_key' as const,
    n8nCredentialType: 'typeformApi',
    apiKeyInstructions: '1. Go to your Typeform account\n2. Click Settings → Personal tokens\n3. Generate a new token\n4. Copy and paste here',
    apiKeyUrl: 'https://admin.typeform.com/user/tokens',
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    description: 'AI and GPT integration',
    iconUrl: '/icons/openai.svg',
    authType: 'api_key' as const,
    n8nCredentialType: 'openAiApi',
    apiKeyInstructions: '1. Go to platform.openai.com\n2. Click on API Keys\n3. Create new secret key\n4. Copy and paste here',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing',
    iconUrl: '/icons/mailchimp.svg',
    authType: 'api_key' as const,
    n8nCredentialType: 'mailchimpApi',
    apiKeyInstructions: '1. Go to Mailchimp\n2. Account → Extras → API keys\n3. Create a key\n4. Copy and paste here',
    apiKeyUrl: 'https://admin.mailchimp.com/account/api/',
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    iconUrl: '/icons/stripe.svg',
    authType: 'api_key' as const,
    n8nCredentialType: 'stripeApi',
    apiKeyInstructions: '1. Go to Stripe Dashboard\n2. Developers → API keys\n3. Copy your Secret key\n4. Paste here',
    apiKeyUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Notes and databases',
    iconUrl: '/icons/notion.svg',
    authType: 'api_key' as const,
    n8nCredentialType: 'notionApi',
    apiKeyInstructions: '1. Go to notion.so/my-integrations\n2. Create new integration\n3. Copy the Internal Integration Token\n4. Paste here',
    apiKeyUrl: 'https://www.notion.so/my-integrations',
  },
];

// ============================================
// Main Seed Function
// ============================================

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed categories
  console.log('📁 Seeding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`   ✓ ${category.name}`);
  }

  // Seed apps
  console.log('\n🔌 Seeding apps...');
  for (const app of apps) {
    await prisma.app.upsert({
      where: { slug: app.slug },
      update: app,
      create: app,
    });
    console.log(`   ✓ ${app.name}`);
  }

  // Seed templates from JSON files
  console.log('\n📝 Seeding templates...');
  const templatesDir = path.join(__dirname, '../../templates');
  
  if (fs.existsSync(templatesDir)) {
    const categoryDirs = fs.readdirSync(templatesDir);
    
    for (const categoryDir of categoryDirs) {
      const categoryPath = path.join(templatesDir, categoryDir);
      if (!fs.statSync(categoryPath).isDirectory()) continue;
      
      const templateFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
      
      for (const templateFile of templateFiles) {
        try {
          const templatePath = path.join(categoryPath, templateFile);
          const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
          
          const category = await prisma.category.findUnique({
            where: { slug: templateData.metadata.category },
          });
          
          if (!category) {
            console.log(`   ⚠ Skipping ${templateFile}: category not found`);
            continue;
          }

          // Get app IDs for required apps
          const requiredAppIds: string[] = [];
          for (const app of templateData.requirements.apps) {
            const dbApp = await prisma.app.findUnique({
              where: { slug: app.slug },
            });
            if (dbApp) {
              requiredAppIds.push(dbApp.id);
            }
          }

          await prisma.template.upsert({
            where: { slug: templateData.metadata.slug },
            update: {
              name: templateData.metadata.name,
              description: templateData.metadata.description,
              longDescription: templateData.metadata.longDescription,
              categoryId: category.id,
              tags: templateData.metadata.tags || [],
              requiredAppIds,
              configFields: templateData.configuration?.fields || [],
              n8nWorkflow: templateData.n8nWorkflow,
              estimatedSetupMinutes: templateData.metadata.estimatedSetupMinutes || 5,
            },
            create: {
              slug: templateData.metadata.slug,
              name: templateData.metadata.name,
              description: templateData.metadata.description,
              longDescription: templateData.metadata.longDescription,
              categoryId: category.id,
              tags: templateData.metadata.tags || [],
              requiredAppIds,
              configFields: templateData.configuration?.fields || [],
              n8nWorkflow: templateData.n8nWorkflow,
              estimatedSetupMinutes: templateData.metadata.estimatedSetupMinutes || 5,
            },
          });
          console.log(`   ✓ ${templateData.metadata.name}`);
        } catch (error) {
          console.log(`   ✗ Error loading ${templateFile}:`, error);
        }
      }
    }
  } else {
    console.log('   ⚠ Templates directory not found');
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
