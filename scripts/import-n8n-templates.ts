/**
 * Import n8n Templates Script
 *
 * This script imports n8n workflow templates from the awesome-n8n-templates repository
 * and converts them into Conduit's template format.
 *
 * Usage: tsx scripts/import-n8n-templates.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Paths
const TEMPLATES_SOURCE = 'C:\\Users\\User\\Documents\\conduit\\n8n-free-templates';
const TEMPLATES_OUTPUT = path.join(__dirname, '..', 'templates');
const README_PATH = path.join(TEMPLATES_SOURCE, 'README.md');

// Node type to App mapping
const NODE_TYPE_TO_APP: Record<string, string> = {
  'gmail': 'gmail',
  'gmailTrigger': 'gmail',
  'googleSheets': 'google-sheets',
  'googleDrive': 'google-drive',
  'googleCalendar': 'google-calendar',
  'slack': 'slack',
  'openAi': 'openai',
  'hubspot': 'hubspot',
  'typeform': 'typeform',
  'typeformTrigger': 'typeform',
  'mailchimp': 'mailchimp',
  'stripe': 'stripe',
  'stripeTrigger': 'stripe',
  'notion': 'notion',
  'notionTrigger': 'notion',
  'airtable': 'airtable',
  'airtableTrigger': 'airtable',
  'telegram': 'telegram',
  'telegramTrigger': 'telegram',
  'discord': 'discord',
  'whatsApp': 'whatsapp',
  'instagram': 'instagram',
  'twitter': 'twitter',
  'wordpress': 'wordpress',
  // AI/ML integrations
  'anthropic': 'anthropic',
  'cohere': 'cohere',
  'huggingFace': 'huggingface',
  // Vector databases
  'pinecone': 'pinecone',
  'weaviate': 'weaviate',
  'qdrant': 'qdrant',
  // Databases
  'redis': 'redis',
  'supabase': 'supabase',
  'postgres': 'postgres',
  'mysql': 'mysql',
  'mongodb': 'mongodb',
};

// Folder to Conduit category mapping
const FOLDER_TO_CATEGORY: Record<string, string> = {
  // Technology & Development
  'AI_ML': 'operations',
  'DevOps': 'operations',
  'Data_Analytics': 'operations',
  'IoT': 'operations',

  // Business Functions
  'E_Commerce_Retail': 'sales',
  'Finance_Accounting': 'operations',
  'HR': 'operations',
  'Legal_Tech': 'operations',
  'Real_Estate': 'sales',

  // Communication & Marketing
  'Email_Automation': 'marketing',
  'Social_Media': 'marketing',
  'Creative_Content': 'marketing',
  'Media': 'marketing',

  // Industry-Specific
  'Agriculture': 'operations',
  'Automotive': 'operations',
  'Education': 'operations',
  'Energy': 'operations',
  'Gaming': 'operations',
  'Government_NGO': 'operations',
  'Healthcare': 'operations',
  'Manufacturing': 'operations',
  'Travel': 'operations',

  // General
  'Productivity': 'productivity',
  'Misc': 'operations',
};

// Department to Conduit category mapping (from README)
const DEPARTMENT_TO_CATEGORY: Record<string, string> = {
  'Ops': 'operations',
  'Sales': 'sales',
  'Marketing': 'marketing',
  'Support': 'support',
  'Executive': 'operations',
  'Security': 'operations',
  'Engineering': 'operations',
  'HR': 'operations',
};

interface N8nWorkflow {
  nodes: Array<{
    type: string;
    name: string;
    parameters?: any;
    credentials?: any;
  }>;
  connections?: any;
  settings?: any;
}

interface TemplateMetadata {
  title: string;
  description: string;
  department?: string;
  folder: string;
  filePath: string;
}

interface ConvertedTemplate {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  requiredAppSlugs: string[];
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
  workflowDefinition: N8nWorkflow;
  configFields: any[];
}

/**
 * Parse README.md to extract template metadata
 */
function parseReadme(): Map<string, TemplateMetadata> {
  const metadataMap = new Map<string, TemplateMetadata>();

  if (!fs.existsSync(README_PATH)) {
    console.warn('⚠️  README.md not found, will use filename-based metadata');
    return metadataMap;
  }

  const content = fs.readFileSync(README_PATH, 'utf-8');
  const lines = content.split('\n');

  let currentCategory = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category headers (e.g., "### Gmail & Email Automation")
    if (line.startsWith('###')) {
      currentCategory = line.replace('###', '').trim();
      continue;
    }

    // Parse table rows
    const match = line.match(/\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\[Link to Template\]\((.+?)\)\s*\|/);
    if (match) {
      const [, title, description, department, relativePath] = match;
      const cleanPath = relativePath.replace(/%20/g, ' ');

      metadataMap.set(cleanPath, {
        title: title.trim(),
        description: description.trim(),
        department: department.trim(),
        folder: currentCategory,
        filePath: path.join(TEMPLATES_SOURCE, cleanPath),
      });
    }
  }

  console.log(`📖 Parsed ${metadataMap.size} templates from README.md`);
  return metadataMap;
}

/**
 * Extract node types from n8n workflow
 */
function extractNodeTypes(workflow: N8nWorkflow): string[] {
  const nodeTypes = new Set<string>();

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    return [];
  }

  for (const node of workflow.nodes) {
    if (node.type && node.type.startsWith('n8n-nodes-base.')) {
      const nodeType = node.type.replace('n8n-nodes-base.', '');
      nodeTypes.add(nodeType);
    }
  }

  return Array.from(nodeTypes);
}

/**
 * Map n8n node types to Conduit app slugs
 */
function nodeTypesToAppSlugs(nodeTypes: string[]): string[] {
  const appSlugs = new Set<string>();

  for (const nodeType of nodeTypes) {
    const lowerType = nodeType.toLowerCase();

    // Check direct mapping
    for (const [key, appSlug] of Object.entries(NODE_TYPE_TO_APP)) {
      if (lowerType.includes(key.toLowerCase())) {
        appSlugs.add(appSlug);
        break;
      }
    }
  }

  return Array.from(appSlugs);
}

/**
 * Generate tags from template name and description
 */
function generateTags(name: string, description: string, folder: string): string[] {
  const tags = new Set<string>();

  const text = `${name} ${description} ${folder}`.toLowerCase();

  // Common tag keywords
  const keywords = [
    'ai', 'automation', 'email', 'slack', 'telegram', 'notion',
    'sheets', 'drive', 'gmail', 'chatbot', 'webhook', 'api',
    'notification', 'analytics', 'crm', 'leads', 'sales',
    'marketing', 'support', 'monitoring', 'reporting',
    // AI/ML keywords
    'vector', 'rag', 'embeddings', 'llm', 'ml', 'data',
    'iot', 'finance', 'healthcare', 'ecommerce', 'devops',
    'database', 'cloud', 'security', 'testing'
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  }

  return Array.from(tags).slice(0, 6); // Limit to 6 tags
}

/**
 * Sanitize workflow (remove credentials, clean up)
 */
function sanitizeWorkflow(workflow: N8nWorkflow): N8nWorkflow {
  const sanitized = JSON.parse(JSON.stringify(workflow));

  // Remove actual credential IDs and names
  if (sanitized.nodes && Array.isArray(sanitized.nodes)) {
    for (const node of sanitized.nodes) {
      if (node.credentials) {
        for (const credType of Object.keys(node.credentials)) {
          node.credentials[credType] = {
            id: 'PLACEHOLDER',
            name: `{{${credType}}}`
          };
        }
      }
    }
  }

  return sanitized;
}

/**
 * Create slug from name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Convert a single n8n template to Conduit format
 */
function convertTemplate(
  filePath: string,
  metadata?: TemplateMetadata
): ConvertedTemplate | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const workflow: N8nWorkflow = JSON.parse(content);

    // Extract filename without extension
    const fileName = path.basename(filePath, '.json');
    const folderName = path.basename(path.dirname(filePath));

    // Use metadata or fallback to filename
    const name = metadata?.title || fileName;
    const description = metadata?.description || `Automated workflow: ${fileName}`;
    const department = metadata?.department;

    // Determine category
    let categorySlug = 'operations'; // default
    if (department && DEPARTMENT_TO_CATEGORY[department]) {
      categorySlug = DEPARTMENT_TO_CATEGORY[department];
    } else if (FOLDER_TO_CATEGORY[folderName]) {
      categorySlug = FOLDER_TO_CATEGORY[folderName];
    }

    // Extract required apps
    const nodeTypes = extractNodeTypes(workflow);
    const requiredAppSlugs = nodeTypesToAppSlugs(nodeTypes);

    // Generate tags
    const tags = generateTags(name, description, folderName);

    // Sanitize workflow
    const sanitizedWorkflow = sanitizeWorkflow(workflow);

    // Estimate setup time (simple heuristic based on node count)
    const nodeCount = workflow.nodes?.length || 0;
    const estimatedSetupMinutes = Math.max(5, Math.min(30, Math.ceil(nodeCount / 2)));

    return {
      name,
      slug: createSlug(name),
      description,
      categorySlug,
      requiredAppSlugs,
      tags,
      popularity: 0,
      estimatedSetupMinutes,
      workflowDefinition: sanitizedWorkflow,
      configFields: [], // TODO: Extract from workflow parameters
    };
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error);
    return null;
  }
}

/**
 * Find all JSON files in the templates directory
 */
function findTemplateFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip specific directories
        if (!['img', 'node_modules', '.git'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip non-template JSON files
        if (!['package.json', 'tsconfig.json'].includes(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting n8n template import...\n');

  // Ensure output directory exists
  if (!fs.existsSync(TEMPLATES_OUTPUT)) {
    fs.mkdirSync(TEMPLATES_OUTPUT, { recursive: true });
  }

  // Parse README for metadata
  const metadataMap = parseReadme();

  // Find all template files
  const templateFiles = findTemplateFiles(TEMPLATES_SOURCE);
  console.log(`📁 Found ${templateFiles.length} template files\n`);

  const converted: ConvertedTemplate[] = [];
  const failed: string[] = [];

  // Convert each template
  for (const filePath of templateFiles) {
    const relativePath = path.relative(TEMPLATES_SOURCE, filePath);
    const metadata = metadataMap.get(relativePath);

    console.log(`📝 Converting: ${relativePath}`);

    const template = convertTemplate(filePath, metadata);
    if (template) {
      converted.push(template);

      // Save to output directory
      const outputPath = path.join(TEMPLATES_OUTPUT, `${template.slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
    } else {
      failed.push(relativePath);
    }
  }

  console.log(`\n✅ Successfully converted ${converted.length} templates`);
  console.log(`❌ Failed to convert ${failed.length} templates\n`);

  // Generate summary
  const summary = {
    total: templateFiles.length,
    converted: converted.length,
    failed: failed.length,
    categories: Array.from(new Set(converted.map(t => t.categorySlug))),
    apps: Array.from(new Set(converted.flatMap(t => t.requiredAppSlugs))),
    failedFiles: failed,
  };

  const summaryPath = path.join(TEMPLATES_OUTPUT, '_import-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('📊 Import Summary:');
  console.log(`   Total templates: ${summary.total}`);
  console.log(`   Converted: ${summary.converted}`);
  console.log(`   Failed: ${summary.failed}`);
  console.log(`   Categories: ${summary.categories.join(', ')}`);
  console.log(`   Apps used: ${summary.apps.join(', ')}`);
  console.log(`\n💾 Templates saved to: ${TEMPLATES_OUTPUT}`);
  console.log(`📄 Summary saved to: ${summaryPath}\n`);
}

// Run the import
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
