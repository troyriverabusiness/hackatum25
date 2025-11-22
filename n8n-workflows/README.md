# n8n Workflows

This directory contains n8n workflows for automating hackathon, scholarship, and event data extraction and processing.

## Overview

The workflows handle:
- **Hackathons**: Scraping, extracting, and storing hackathon information
- **Scholarships**: Extracting scholarship details and sending notifications
- **Events**: Processing event links and managing database entries

## Required Credentials

The following credentials must be configured in n8n before importing these workflows:

### Supabase
- **Purpose**: Database operations for storing hackathons, scholarships, and events
- **Required**: Project URL and Service Role Key (or anon key with appropriate RLS)
- **Tables Used**: `hackathons`, `scholarships`, `events`

### Telegram Bot
- **Purpose**: Sending notifications and formatted messages to Telegram channels/groups
- **Required**: Bot Token and Chat ID
- **Credentials Referenced**:
  - `Partner Events Pinger Credential` - for hackathon and event notifications
  - `Scholarschips Bot` - for scholarship notifications

### Firecrawl
- **Purpose**: Web scraping and content extraction from URLs
- **Required**: API Key from [Firecrawl](https://firecrawl.dev) or [Mendable Firecrawl](https://mendable.ai/firecrawl)
- **Note**: Uses the `@mendable/n8n-nodes-firecrawl` community node

### Anthropic (or Another LLM)
- **Purpose**: Summarizing and processing text content (descriptions, classifications)
- **Options**:
  - **Anthropic Claude**: Scholarships workflow uses `claude-haiku-4-5-20251001`
  - **Ollama**: Hackathons workflow uses `llama3.2:3b` (local alternative)
  - **Other**: OpenAI, Google AI (Gemini), Azure OpenAI, Hugging Face

## 🚀 Workflow Magic

### 🧩 [HACKATHONS] - Extract and Insert.json

**THE Magic Sauce**: Automates the entire pipeline from hackathon URL to database entry and notification. Instead of manually copying information, formatting dates, and writing descriptions, this workflow transforms unstructured web pages into clean, structured data with AI-summarized descriptions and automatically posts formatted notifications to Telegram.

- **Trigger**: Webhook (POST with `event_link` in body)
- **Flow**: URL validation → Duplicate check → Firecrawl scraping → LLM description summarization → Location formatting → Supabase insert → Telegram notification

### 🎓 [SCHOLARSHIPS] - Extract & Message.json

**THE Magic Sauce**: Eliminates manual data entry and categorization for scholarships. The workflow intelligently extracts scholarship details, normalizes study levels (Bachelor/Masters/PhD) and fields of study into standardized categories, condenses verbose descriptions into concise summaries, and formats everything into ready-to-post messages - turning hours of research into seconds of automation.

- **Trigger**: Webhook (POST with `scholarship_link` in body)
- **Flow**: URL cleaning → Duplicate check → Firecrawl scraping → Field formatting (study levels, fields, funding) → Anthropic Claude description summarization → Supabase insert → Telegram message

### 🔗 Link – Telegram status update + DB entry (testing).json

**THE Magic Sauce**: Intelligent content routing and classification. This workflow automatically determines whether a submitted link is an event or hackathon using AI, prevents duplicates across both database tables, and routes the content to the appropriate storage and notification channels - eliminating the need for manual categorization and duplicate checking.

- **Trigger**: Webhook (POST with `event_link` in body)
- **Flow**: URL validation → Firecrawl scraping → LLM classification (event/hackathon) → Duplicate check → Description summarization → Date/time/location formatting → Database entry → Telegram notification

## Important Notes

- Chat IDs and webhook paths are environment-specific and need to be updated
- Workflows require specific Supabase table schemas matching the expected structure

