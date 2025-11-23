# Blau Tech - Student Hub 🚀

> **Connecting Bavaria's next generation of tech talent with real opportunities**

Blau Tech is a comprehensive platform that helps students, junior talent, and early-stage founders in Bavaria discover and connect with tech events, hackathons, and scholarship opportunities. Built for Hackatum 2025.

## 🎯 Problem Statement

Students and young professionals in Bavaria struggle to:
- **Discover opportunities**: Finding relevant tech events, hackathons, and scholarships requires constant manual research across multiple platforms
- **Stay organized**: Information is scattered across websites, social media, and newsletters
- **Act quickly**: By the time opportunities are discovered, deadlines may have passed
- **Access quality information**: Raw web pages contain unstructured data that's hard to parse and compare

## ✨ Solution

Blau Tech provides a **centralized, automated platform** that:
- **Aggregates** opportunities from across the web using AI-powered extraction
- **Organizes** information into clear, searchable categories (Events, Hackathons, Scholarships)
- **Delivers** real-time updates via Telegram notifications
- **Presents** a beautiful, modern web interface for browsing and discovery

## 🎨 Key Features

### Frontend (React + Vite)
- **Modern UI/UX**: Beautiful, responsive design with animated tabbed navigation
- **Real-time Updates**: Live data synchronization using Supabase subscriptions
- **Organized Navigation**: 
  - **For You**: Personalized timeline of upcoming opportunities
  - **Events**: Browse tech events in Bavaria
  - **Hackathons**: Discover hackathons with prize information and deadlines
  - **Scholarships**: Explore funding opportunities with application deadlines
- **Visual Differentiation**: Unique color themes for each content type (events, hackathons, scholarships)
- **Interactive Cards**: Detailed modals with full information for each opportunity

### Backend Automation (n8n Workflows)
- **AI-Powered Extraction**: Automatically scrapes and structures data from URLs
- **Intelligent Classification**: AI determines if a link is an event or hackathon
- **Smart Summarization**: LLM-powered description generation from raw web content
- **Duplicate Prevention**: Automatic duplicate detection across all content types
- **Telegram Integration**: Formatted notifications sent to Telegram channels
- **Data Normalization**: Standardizes dates, locations, study levels, and fields

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Three.js / Vanta.js** - 3D backgrounds and visual effects
- **Supabase JS** - Real-time database client

### Backend & Automation
- **Supabase** - PostgreSQL database with real-time subscriptions
- **n8n** - Workflow automation platform
- **Firecrawl** - Web scraping and content extraction
- **Anthropic Claude** - LLM for content summarization and classification
- **Telegram Bot API** - Notification delivery

## 📁 Project Structure

```
hackatum25/
├── blau-tech-landing/          # Frontend React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Partners.jsx    # Partners page
│   │   │   ├── Events.jsx      # Events page
│   │   │   └── students/       # Students section
│   │   │       ├── StudentsLayout.jsx
│   │   │       ├── ForYou.jsx
│   │   │       ├── EventsPage.jsx
│   │   │       ├── HackathonsPage.jsx
│   │   │       └── ScholarshipsPage.jsx
│   │   ├── components/         # Reusable components
│   │   └── lib/                # Utilities (Supabase client, ICS generator)
│   └── package.json
│
└── n8n-workflows/              # Automation workflows
    ├── [HACKATHONS] - Extract and Insert.json
    ├── [SCHOLARSHIPS] - Extract & Message.json
    └── Link – Telegram status update + DB entry (testing).json
```

## 🤖 Automation Workflows

### 1. Hackathons Extraction Pipeline
**File**: `[HACKATHONS] - Extract and Insert.json`

**Flow**:
1. Receives hackathon URL via webhook
2. Validates URL and checks for duplicates
3. Scrapes content using Firecrawl
4. Generates AI summary of description
5. Formats location and date information
6. Inserts structured data into Supabase
7. Sends formatted notification to Telegram

**Impact**: Transforms hours of manual data entry into seconds of automation

### 2. Scholarships Extraction Pipeline
**File**: `[SCHOLARSHIPS] - Extract & Message.json`

**Flow**:
1. Receives scholarship URL via webhook
2. Cleans URL and checks for duplicates
3. Extracts content with Firecrawl
4. Normalizes study levels (Bachelor/Masters/PhD)
5. Categorizes fields of study
6. Summarizes description using Claude
7. Stores in database and notifies via Telegram

**Impact**: Eliminates manual categorization and formatting work

### 3. Intelligent Link Router
**File**: `Link – Telegram status update + DB entry (testing).json`

**Flow**:
1. Receives any opportunity URL
2. Scrapes content
3. **AI classifies** as event or hackathon
4. Checks duplicates across both tables
5. Routes to appropriate database table
6. Formats and sends notification

**Impact**: Single entry point that intelligently routes content to the right place

## 🗄️ Database Schema

### Events Table
Stores regular events and scholarships:
- `name`, `description`, `link`
- `start_date`, `start_time`
- `location`, `format` (online/in-person)
- `organisers`, `type` (event/scholarship)
- `is_highlight` (featured opportunities)

### Hackathons Table
Dedicated table for hackathons:
- All event fields plus:
- `prizes` (prize pool information)
- `end_date`, `end_time`
- `signup_deadline`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- n8n instance (self-hosted or cloud)
- Telegram Bot Token
- Firecrawl API key
- Anthropic API key (or alternative LLM)

### Frontend Setup

1. **Install dependencies**:
```bash
cd blau-tech-landing
npm install
```

2. **Configure environment variables**:
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Start development server**:
```bash
npm run dev
```

4. **Build for production**:
```bash
npm run build
```

### Backend/Workflow Setup

1. **Set up Supabase**:
   - Create tables: `events`, `hackathons`
   - Configure Row Level Security (RLS) policies
   - Enable real-time subscriptions

2. **Import n8n workflows**:
   - Import JSON files from `n8n-workflows/` directory
   - Configure credentials:
     - Supabase (URL + Service Role Key)
     - Telegram Bot (Token + Chat ID)
     - Firecrawl (API Key)
     - Anthropic/LLM (API Key)

3. **Activate workflows**:
   - Enable webhook triggers
   - Test with sample URLs

## 🎯 Use Cases

1. **For Students**: 
   - Browse upcoming events in one place
   - Never miss a hackathon deadline
   - Discover scholarship opportunities

2. **For Organizers**:
   - Submit event/hackathon URLs via webhook
   - Automatic extraction and formatting
   - Instant Telegram notifications to community

3. **For Community Managers**:
   - Single source of truth for all opportunities
   - Automated content moderation and formatting
   - Real-time updates without manual work

## 🔮 Future Enhancements

- [ ] User authentication and personalized recommendations
- [ ] Calendar integration (Google Calendar, .ics export)
- [ ] Advanced filtering (date range, location, category)
- [ ] Search functionality with full-text search
- [ ] Bookmarking and application tracking
- [ ] Email reminders for deadlines
- [ ] Push notifications
- [ ] Analytics dashboard for organizers
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## 📊 Impact

- **Time Saved**: Reduces manual data entry from hours to seconds
- **Coverage**: Aggregates opportunities from multiple sources automatically
- **Accuracy**: AI-powered extraction reduces human error
- **Engagement**: Real-time notifications ensure community stays informed
- **Accessibility**: Centralized platform makes opportunities discoverable

## 📝 License

This project was built for Hackatum 2025.

## 🙏 Acknowledgments

- Built with ❤️ for the Bavarian tech community
- Inspired by modern web design patterns
- Powered by open-source technologies

---

**Built at Hackatum 2025** 🎉
