/**
 * Seed Templates from Converted Files
 *
 * This script loads all converted templates from the templates/ directory
 * and inserts them into the database.
 *
 * Usage: tsx scripts/seed-templates-from-files.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Apps to ensure exist in database (from import summary)
const REQUIRED_APPS = [
  { slug: 'google-drive', name: 'Google Drive', authType: 'oauth2', n8nType: 'googleDriveOAuth2Api' },
  { slug: 'gmail', name: 'Gmail', authType: 'oauth2', n8nType: 'gmailOAuth2' },
  { slug: 'airtable', name: 'Airtable', authType: 'api_key', n8nType: 'airtableTokenApi' },
  { slug: 'google-calendar', name: 'Google Calendar', authType: 'oauth2', n8nType: 'googleCalendarOAuth2Api' },
  { slug: 'telegram', name: 'Telegram', authType: 'api_key', n8nType: 'telegramApi' },
  { slug: 'google-sheets', name: 'Google Sheets', authType: 'oauth2', n8nType: 'googleSheetsOAuth2Api' },
  { slug: 'twitter', name: 'Twitter/X', authType: 'oauth2', n8nType: 'twitterOAuth2Api' },
  { slug: 'openai', name: 'OpenAI', authType: 'api_key', n8nType: 'openAiApi' },
  { slug: 'discord', name: 'Discord', authType: 'oauth2', n8nType: 'discordOAuth2Api' },
  { slug: 'slack', name: 'Slack', authType: 'oauth2', n8nType: 'slackOAuth2Api' },
  { slug: 'typeform', name: 'Typeform', authType: 'oauth2', n8nType: 'typeformOAuth2Api' },
  { slug: 'notion', name: 'Notion', authType: 'oauth2', n8nType: 'notionOAuth2Api' },
  { slug: 'whatsapp', name: 'WhatsApp', authType: 'api_key', n8nType: 'whatsappApi' },
  { slug: 'wordpress', name: 'WordPress', authType: 'api_key', n8nType: 'wordpressApi' },
  { slug: 'hubspot', name: 'HubSpot', authType: 'oauth2', n8nType: 'hubspotOAuth2Api' },
  { slug: 'mailchimp', name: 'Mailchimp', authType: 'oauth2', n8nType: 'mailchimpOAuth2Api' },
  { slug: 'stripe', name: 'Stripe', authType: 'api_key', n8nType: 'stripeApi' },
];

interface ConvertedTemplate {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  requiredAppSlugs: string[];
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
  workflowDefinition: any;
  configFields: any[];
}

async function ensureApps() {
  console.log('🔌 Ensuring all required apps exist...');

  for (const app of REQUIRED_APPS) {
    await prisma.app.upsert({
      where: { slug: app.slug },
      update: {},
      create: {
        slug: app.slug,
        name: app.name,
        description: `${app.name} integration`,
        iconUrl: `/icons/${app.slug}.svg`,
        authType: app.authType as any,
        n8nCredentialType: app.n8nType,
        isActive: true,
      },
    });
  }

  console.log(`✅ Ensured ${REQUIRED_APPS.length} apps exist`);
}

async function loadTemplates(): Promise<ConvertedTemplate[]> {
  const templates: ConvertedTemplate[] = [];
  const files = fs.readdirSync(TEMPLATES_DIR);

  for (const file of files) {
    if (file.endsWith('.json') && !file.startsWith('_')) {
      try {
        const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
        const template = JSON.parse(content) as ConvertedTemplate;
        templates.push(template);
      } catch (error) {
        console.error(`❌ Error reading ${file}:`, error);
      }
    }
  }

  return templates;
}

async function seedTemplates(templates: ConvertedTemplate[]) {
  console.log(`📋 Seeding ${templates.length} templates...`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const template of templates) {
    try {
      // Find category
      const category = await prisma.category.findUnique({
        where: { slug: template.categorySlug },
      });

      if (!category) {
        console.warn(`⚠️  Category not found: ${template.categorySlug} for template: ${template.name}`);
        errors++;
        continue;
      }

      // Find required apps
      const apps = await prisma.app.findMany({
        where: {
          slug: {
            in: template.requiredAppSlugs,
          },
        },
      });

      // Check if template exists
      const existing = await prisma.template.findUnique({
        where: { slug: template.slug },
      });

      if (existing) {
        // Update existing
        await prisma.template.update({
          where: { slug: template.slug },
          data: {
            name: template.name,
            description: template.description,
            tags: template.tags,
            popularity: template.popularity,
            estimatedSetupMinutes: template.estimatedSetupMinutes,
            n8nWorkflow: template.workflowDefinition as any,
            configFields: template.configFields as any,
            categoryId: category.id,
            requiredAppIds: apps.map((app) => app.id),
          },
        });
        updated++;
      } else {
        // Create new
        await prisma.template.create({
          data: {
            slug: template.slug,
            name: template.name,
            description: template.description,
            tags: template.tags,
            popularity: template.popularity,
            estimatedSetupMinutes: template.estimatedSetupMinutes,
            n8nWorkflow: template.workflowDefinition as any,
            configFields: template.configFields as any,
            categoryId: category.id,
            requiredAppIds: apps.map((app) => app.id),
          },
        });
        created++;
      }

      if ((created + updated) % 50 === 0) {
        console.log(`   Processed ${created + updated}/${templates.length} templates...`);
      }
    } catch (error) {
      console.error(`❌ Error seeding template ${template.slug}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Template seeding complete:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
}

async function main() {
  console.log('🌱 Starting template seed from files...\n');

  // Ensure all required apps exist
  await ensureApps();

  // Load templates from files
  const templates = await loadTemplates();
  console.log(`📂 Loaded ${templates.length} templates from files\n`);

  // Seed templates into database
  await seedTemplates(templates);

  console.log('\n🎉 Template seed completed!');
}

main()
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
