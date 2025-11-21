# Students Section - New Structure

This folder contains the improved students section with a tabbed navigation structure, inspired by the Oranje Finance website.

## Structure

```
students/
├── StudentsLayout.jsx    # Main layout with tabbed navigation
├── ForYou.jsx           # Personalized timeline page
├── EventsPage.jsx       # Events listing and details
├── HackathonsPage.jsx   # Hackathons listing and details
├── ScholarshipsPage.jsx # Scholarships listing and details
└── README.md            # This file
```

## Features

### 1. Tabbed Navigation
- **For You**: A personalized timeline view showing upcoming opportunities
- **Events**: Browse and discover tech events in Bavaria
- **Hackathons**: Find hackathons to participate in
- **Scholarships**: Explore funding opportunities

### 2. Layout Component (`StudentsLayout.jsx`)
- Shared navigation bar with animated tab switching
- Consistent header across all student pages
- Uses React Router's `Outlet` for nested routing

### 3. Individual Pages

#### ForYou (`ForYou.jsx`)
- Currently displays a simple timeline of all types of opportunities
- Placeholder for future personalization features
- Can be enhanced with user preferences and recommendations

#### EventsPage (`EventsPage.jsx`)
- Fetches events from Supabase `events` table
- Filters for events where `type = 'event'`
- Grid layout with event cards
- Modal for detailed event information
- Real-time updates via Supabase subscriptions

#### HackathonsPage (`HackathonsPage.jsx`)
- Fetches from Supabase `hackathons` table
- Displays hackathon-specific information (prizes, end date, signup deadline)
- Purple-themed cards to differentiate from events
- Modal with detailed hackathon information

#### ScholarshipsPage (`ScholarshipsPage.jsx`)
- Fetches scholarships from `events` table where `type = 'scholarship'`
- Yellow/gold-themed cards for visual distinction
- Shows application deadlines prominently
- Modal with scholarship details

## Routing

The new routing structure in `App.jsx`:

```jsx
/students                    → Redirects to /students/for-you
/students/for-you           → ForYou page
/students/events            → EventsPage
/students/hackathons        → HackathonsPage
/students/scholarships      → ScholarshipsPage
```

The old `/students` route is now available at `/students-old` for backwards compatibility.

## Database Schema

### Events Table
- Used for both events and scholarships
- Key fields: `name`, `type`, `start_date`, `start_time`, `description`, `link`, `organisers`, `location`, `format`, `is_highlight`

### Hackathons Table
- Dedicated table for hackathons
- Additional fields: `prizes`, `end_date`, `end_time`, `signup_deadline`

## Styling

- Uses existing CSS classes from `index.css`:
  - `event-card` - Standard event styling
  - `hackathon-card` - Purple-themed hackathon styling
  - `glass-card` - Generic glass-morphism card
  - `section-container` - Standard page container
  - Utility classes for consistent styling

## Future Enhancements

1. **For You Page**:
   - User authentication and preferences
   - Personalized recommendations based on interests
   - Saved/bookmarked opportunities
   - Application tracking

2. **Filtering & Search**:
   - Date range filters
   - Location-based filtering
   - Search by keywords
   - Category/tag filtering

3. **Calendar Integration**:
   - Add to Google Calendar
   - Export to .ics files
   - Calendar view toggle

4. **Notifications**:
   - Email reminders for deadlines
   - Push notifications for new opportunities
   - Application status updates

