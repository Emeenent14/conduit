# FlowMatic - Template Catalog Structure

## Overview

This document defines how n8n workflow templates are organized, structured, and stored for use in FlowMatic.

---

## Template Categories

### Primary Categories

| ID | Slug | Name | Icon | Description |
|----|------|------|------|-------------|
| 1 | `lead-management` | Lead Management | `users` | Capture, notify, and manage leads |
| 2 | `marketing` | Marketing | `megaphone` | Marketing automation workflows |
| 3 | `sales` | Sales | `dollar-sign` | Sales process automation |
| 4 | `operations` | Operations | `settings` | Business operations |
| 5 | `support` | Customer Support | `headphones` | Support ticket workflows |
| 6 | `productivity` | Productivity | `zap` | Personal productivity |

---

## Template File Structure

Templates are stored as JSON files in the `/templates` directory:

```
templates/
├── lead-management/
│   ├── lead-to-slack-notification.json
│   ├── lead-to-crm-email.json
│   ├── lead-to-google-sheets.json
│   ├── lead-scoring-automation.json
│   └── lead-assignment-workflow.json
├── marketing/
│   ├── social-media-crosspost.json
│   ├── email-campaign-trigger.json
│   ├── content-calendar-sync.json
│   ├── newsletter-subscriber-sync.json
│   └── utm-tracking-logger.json
├── sales/
│   ├── deal-closed-celebration.json
│   ├── pipeline-stage-notifications.json
│   ├── quote-followup-reminder.json
│   └── meeting-scheduler-sync.json
├── operations/
│   ├── invoice-to-accounting.json
│   ├── order-to-fulfillment.json
│   ├── low-stock-alert.json
│   └── document-approval-flow.json
├── support/
│   ├── ticket-escalation.json
│   └── customer-feedback-collector.json
└── productivity/
    ├── daily-standup-reminder.json
    ├── meeting-notes-sync.json
    └── task-deadline-alerts.json
```

---

## Template JSON Schema

Each template file follows this structure:

```json
{
  "$schema": "../template.schema.json",
  "metadata": {
    "slug": "lead-to-slack-notification",
    "name": "New Lead → Slack Notification",
    "description": "Get notified in Slack when a new lead comes in",
    "longDescription": "## How it works\n\nThis automation monitors your lead source...",
    "category": "lead-management",
    "tags": ["leads", "notifications", "real-time"],
    "estimatedSetupMinutes": 5,
    "author": "FlowMatic",
    "version": "1.0.0"
  },
  "requirements": {
    "apps": [
      {
        "slug": "typeform",
        "role": "trigger",
        "description": "Triggers when a new form response is submitted"
      },
      {
        "slug": "slack",
        "role": "action",
        "description": "Sends notification to your chosen channel"
      }
    ]
  },
  "configuration": {
    "fields": [
      {
        "id": "slack_channel",
        "type": "text",
        "label": "Slack Channel",
        "placeholder": "#leads",
        "required": true,
        "helpText": "The channel where notifications will be posted",
        "validation": {
          "pattern": "^#[a-z0-9-_]+$",
          "message": "Must be a valid Slack channel (e.g., #leads)"
        }
      },
      {
        "id": "include_all_fields",
        "type": "boolean",
        "label": "Include all form fields",
        "default": true,
        "helpText": "If enabled, all form responses will be included in the notification"
      },
      {
        "id": "notification_emoji",
        "type": "select",
        "label": "Notification Emoji",
        "default": "🔔",
        "options": [
          { "value": "🔔", "label": "🔔 Bell" },
          { "value": "🎯", "label": "🎯 Target" },
          { "value": "⚡", "label": "⚡ Lightning" },
          { "value": "🚀", "label": "🚀 Rocket" }
        ]
      }
    ]
  },
  "n8nWorkflow": {
    "name": "{{WORKFLOW_NAME}}",
    "nodes": [
      {
        "parameters": {
          "formId": "={{$credentials.typeformApi.formId}}"
        },
        "name": "Typeform Trigger",
        "type": "n8n-nodes-base.typeformTrigger",
        "typeVersion": 1,
        "position": [250, 300],
        "credentials": {
          "typeformApi": "{{CREDENTIAL:typeform}}"
        }
      },
      {
        "parameters": {
          "channel": "{{CONFIG:slack_channel}}",
          "text": "{{CONFIG:notification_emoji}} New Lead!\n\nName: {{$json.answers[0].text}}\nEmail: {{$json.answers[1].email}}"
        },
        "name": "Slack",
        "type": "n8n-nodes-base.slack",
        "typeVersion": 2,
        "position": [500, 300],
        "credentials": {
          "slackOAuth2Api": "{{CREDENTIAL:slack}}"
        }
      }
    ],
    "connections": {
      "Typeform Trigger": {
        "main": [[{ "node": "Slack", "type": "main", "index": 0 }]]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  }
}
```

---

## Placeholder System

Templates use placeholders that are replaced at deployment time:

### Credential Placeholders

Format: `{{CREDENTIAL:app_slug}}`

```json
"credentials": {
  "slackOAuth2Api": "{{CREDENTIAL:slack}}",
  "googleSheetsOAuth2Api": "{{CREDENTIAL:google-sheets}}"
}
```

At deployment, these are replaced with the n8n credential IDs.

### Configuration Placeholders

Format: `{{CONFIG:field_id}}`

```json
"parameters": {
  "channel": "{{CONFIG:slack_channel}}",
  "spreadsheetId": "{{CONFIG:spreadsheet_id}}"
}
```

At deployment, these are replaced with user-provided values.

### System Placeholders

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `{{WORKFLOW_NAME}}` | User's workflow name | "My Lead Notifier" |
| `{{USER_ID}}` | User's ID | "usr_abc123" |
| `{{WORKFLOW_ID}}` | Workflow ID | "wf_xyz789" |

---

## Configuration Field Types

### Text Field

```json
{
  "id": "spreadsheet_id",
  "type": "text",
  "label": "Google Sheet ID",
  "placeholder": "1BxiMVs0XRA5nFMd...",
  "required": true,
  "helpText": "Found in the URL of your Google Sheet",
  "validation": {
    "minLength": 20,
    "maxLength": 100
  }
}
```

### Select Field

```json
{
  "id": "priority",
  "type": "select",
  "label": "Priority Level",
  "default": "medium",
  "options": [
    { "value": "high", "label": "High" },
    { "value": "medium", "label": "Medium" },
    { "value": "low", "label": "Low" }
  ]
}
```

### Boolean Field

```json
{
  "id": "send_confirmation",
  "type": "boolean",
  "label": "Send confirmation email",
  "default": false,
  "helpText": "If enabled, sends a confirmation to the lead"
}
```

### Number Field

```json
{
  "id": "delay_minutes",
  "type": "number",
  "label": "Delay (minutes)",
  "default": 5,
  "min": 1,
  "max": 60,
  "helpText": "Wait time before sending notification"
}
```

### Textarea Field

```json
{
  "id": "message_template",
  "type": "textarea",
  "label": "Message Template",
  "default": "New lead from {{name}}",
  "rows": 4,
  "helpText": "Supports variables: {{name}}, {{email}}, {{company}}"
}
```

---

## 20 MVP Templates

### Lead Management (5)

1. **lead-to-slack-notification**
   - Apps: Typeform → Slack
   - Config: channel
   
2. **lead-to-crm-email**
   - Apps: Typeform → HubSpot → Gmail
   - Config: pipeline_id, email_template
   
3. **lead-to-google-sheets**
   - Apps: Typeform → Google Sheets
   - Config: spreadsheet_id, sheet_name
   
4. **facebook-lead-to-slack**
   - Apps: Facebook Lead Ads → Slack
   - Config: channel, form_id
   
5. **lead-response-email**
   - Apps: Typeform → Gmail
   - Config: from_name, subject, body

### Marketing (5)

6. **social-crosspost**
   - Apps: Buffer trigger → Twitter + LinkedIn
   - Config: accounts
   
7. **email-open-slack-alert**
   - Apps: Mailchimp → Slack
   - Config: channel, campaign_id
   
8. **new-subscriber-welcome**
   - Apps: Mailchimp → Gmail
   - Config: welcome_email_template
   
9. **content-to-social**
   - Apps: RSS → Buffer
   - Config: rss_url, accounts
   
10. **utm-logger**
    - Apps: Webhook → Google Sheets
    - Config: spreadsheet_id

### Sales (4)

11. **deal-won-celebration**
    - Apps: HubSpot → Slack
    - Config: channel, min_deal_value
    
12. **pipeline-notifications**
    - Apps: HubSpot → Slack
    - Config: channel, stages_to_notify
    
13. **meeting-reminder**
    - Apps: Google Calendar → Slack
    - Config: reminder_minutes, channel
    
14. **quote-followup**
    - Apps: Schedule → Gmail
    - Config: days_after, email_template

### Operations (4)

15. **invoice-to-sheets**
    - Apps: Stripe → Google Sheets
    - Config: spreadsheet_id
    
16. **low-stock-alert**
    - Apps: Webhook → Slack
    - Config: threshold, channel
    
17. **order-confirmation**
    - Apps: Stripe → Gmail
    - Config: email_template
    
18. **expense-logger**
    - Apps: Gmail (receipt) → Google Sheets
    - Config: spreadsheet_id, label

### Support (2)

19. **ticket-escalation**
    - Apps: Schedule + Zendesk → Slack
    - Config: hours_threshold, channel
    
20. **feedback-collector**
    - Apps: Typeform → Google Sheets + Slack
    - Config: spreadsheet_id, channel

---

## Template Validation

Before deployment, templates are validated:

```typescript
interface TemplateValidation {
  // All required apps have credentials
  hasAllCredentials: boolean;
  missingCredentials: string[];
  
  // All required config fields have values
  hasAllConfig: boolean;
  missingConfig: string[];
  
  // n8n workflow JSON is valid
  isValidWorkflow: boolean;
  workflowErrors: string[];
}

function validateTemplate(
  template: Template,
  userCredentials: Credential[],
  configValues: Record<string, any>
): TemplateValidation {
  // Implementation
}
```

---

## Template Deployment Process

```
1. User selects template
        ↓
2. Load template JSON from database
        ↓
3. Validate user has required credentials
        ↓
4. Collect configuration field values
        ↓
5. Replace all placeholders:
   - {{CREDENTIAL:*}} → n8n credential IDs
   - {{CONFIG:*}} → User values
   - {{WORKFLOW_NAME}} → User's name
        ↓
6. POST workflow to n8n API
        ↓
7. POST /workflows/{id}/activate to n8n
        ↓
8. Store mapping in user_workflows table
        ↓
9. Workflow is now running!
```

---

## Adding New Templates

### Checklist for New Template

- [ ] Template follows JSON schema
- [ ] All placeholders use correct format
- [ ] Apps exist in `apps` table
- [ ] Config fields have proper validation
- [ ] Long description is helpful markdown
- [ ] Template tested manually in n8n first
- [ ] Tags are relevant and consistent
- [ ] Estimated setup time is accurate

### Template Testing

Before adding a template:

1. Build the workflow manually in n8n
2. Test with real credentials
3. Verify all nodes execute successfully
4. Export the workflow JSON
5. Replace credentials/config with placeholders
6. Test deployment through the app

---

## Template Versioning

Templates include version numbers:

```json
{
  "metadata": {
    "version": "1.0.0"
  }
}
```

When updating templates:
- Patch (1.0.1): Bug fixes, copy changes
- Minor (1.1.0): New optional fields, improvements
- Major (2.0.0): Breaking changes, new required apps

Active user workflows continue using their deployed version.
