# Blau Tech - Student Hub

## Recent Updates

### New Students Section with Tabbed Navigation 🎉

The students section has been completely redesigned with a modern tabbed navigation structure inspired by [Oranje Finance](https://oranje-finance.com/).

#### New Structure

The students section (`/students`) now features four main tabs:

1. **For You** (`/students/for-you`) - A personalized timeline view showing upcoming opportunities
2. **Events** (`/students/events`) - Browse tech events in Bavaria
3. **Hackathons** (`/students/hackathons`) - Discover hackathons to participate in
4. **Scholarships** (`/students/scholarships`) - Explore funding opportunities

#### Key Features

- **Beautiful Tabbed Navigation**: Smooth animated tab switching with visual indicators
- **Organized Layout**: Each category has its own dedicated page with tailored content
- **Real-time Updates**: All pages use Supabase subscriptions for live data updates
- **Responsive Design**: Works seamlessly on all device sizes
- **Type-specific Styling**: Events, hackathons, and scholarships each have unique visual themes

#### File Organization

The new structure is organized in the `src/pages/students/` subfolder:

```
src/pages/students/
├── StudentsLayout.jsx      # Main layout with tabbed navigation
├── ForYou.jsx             # Personalized timeline page
├── EventsPage.jsx         # Events listing and details
├── HackathonsPage.jsx     # Hackathons listing and details
├── ScholarshipsPage.jsx   # Scholarships listing and details
└── README.md              # Detailed documentation
```

#### Backward Compatibility

The old students page is still accessible at `/students-old` for reference.

## Development

### Getting Started

1. Install dependencies:
```bash
cd blau-tech-landing
npm install
```

2. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

### Project Structure

- `/src/pages/students/` - New tabbed students section
- `/src/pages/Students.jsx` - Original students page (legacy)
- `/src/components/` - Shared components (Navbar, Background, Modal)
- `/src/lib/` - Utility functions and Supabase client

## Database Schema

### Events Table
- Used for regular events and scholarships
- Key fields: `name`, `start_date`, `start_time`, `description`, `link`, `organisers`, `location`, `format`, `is_highlight`

### Hackathons Table
- Dedicated table for hackathons
- Additional fields: `prizes`, `end_date`, `end_time`, `signup_deadline`

---

# hackatum25
