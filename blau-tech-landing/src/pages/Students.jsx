import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, BoltIcon, XMarkIcon, ArrowRightIcon, Squares2X2Icon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import StaticBackground from '../components/StaticBackground';
import JoinModal from '../components/JoinModal';
import { supabase } from '../lib/supabase';

const Students = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'event', 'hackathon', 'scholarship'
  const [view, setView] = useState('timeline'); // 'timeline' or 'calendar'
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
  const [selectedWeekStart, setSelectedWeekStart] = useState(null); // Start date of the selected week

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from both events and hackathons tables
      const [eventsResult, hackathonsResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('hackathons')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (hackathonsResult.error) throw hackathonsResult.error;

      // Debug: Log raw data from database
      console.log('Events fetched from database:', eventsResult.data?.length || 0, 'events');
      console.log('Hackathons fetched from database:', hackathonsResult.data?.length || 0, 'hackathons');

      // Transform events data to a unified format
      const transformedEvents = (eventsResult.data || []).map(event => {
        // Try to determine event type from existing data
        let eventType = 'event'; // default
        const nameLower = (event.name || '').toLowerCase();
        const descLower = (event.description || '').toLowerCase();
        
        // Check if type field exists in database and is not empty/null
        if (event.type && typeof event.type === 'string' && event.type.trim() !== '') {
          // Normalize the type (lowercase, trimmed)
          eventType = event.type.toLowerCase().trim();
        } else {
          // Infer type from name/description - check for various forms
          // Check for hackathon (more specific patterns to avoid false positives)
          const hackathonPatterns = ['hackathon', 'hack week', 'hack weekend', 'hack day'];
          const isHackathon = hackathonPatterns.some(pattern => 
            nameLower.includes(pattern) || descLower.includes(pattern)
          );
          
          if (isHackathon) {
            eventType = 'hackathon';
          } else if (nameLower.includes('scholarship') || descLower.includes('scholarship') ||
                     nameLower.includes('stipend') || descLower.includes('stipend')) {
            eventType = 'scholarship';
          }
        }

        return {
          id: event.id,
          name: event.name,
          type: eventType,
          date: event.start_date || null,
          time: event.start_time || null,
          description: event.description || null,
          link: event.link || null,
          organizer: event.organisers || null,
          location: event.location || null,
          format: event.format || null,
          isHighlight: event.is_highlight || false,
          createdAt: event.created_at,
        };
      });

      // Transform hackathons data to a unified format
      const transformedHackathons = (hackathonsResult.data || []).map(hackathon => ({
        id: `hackathon-${hackathon.id}`, // Prefix to avoid ID conflicts
        name: hackathon.name,
        type: 'hackathon', // Always mark as hackathon
        date: hackathon.start_date || null,
        time: hackathon.start_time || null,
        description: hackathon.description || null,
        link: hackathon.link || null,
        organizer: hackathon.organisers || null,
        location: hackathon.location || null,
        format: null,
        prizes: hackathon.prizes || null,
        endDate: hackathon.end_date || null,
        endTime: hackathon.end_time || null,
        signupDeadline: hackathon.signup_deadline || null,
        isHighlight: hackathon.is_highlight || false,
        createdAt: hackathon.created_at,
      }));

      // Combine both datasets
      const allEvents = [...transformedEvents, ...transformedHackathons];
      
      // Sort by created_at descending
      allEvents.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Set up real-time subscription for events and hackathons
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('Event change detected:', payload);
          // Refetch events when changes occur
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hackathons',
        },
        (payload) => {
          console.log('Hackathon change detected:', payload);
          // Refetch events when changes occur
          fetchEvents();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  // Helper function to check if an event is today or in the future
  const isEventTodayOrFuture = (event) => {
    if (!event.date) return true; // Events without dates are shown
    
    try {
      let eventDate;
      if (event.date.includes('/')) {
        const [day, month, year] = event.date.split('/');
        eventDate = new Date(`${year}-${month}-${day}`);
      } else {
        eventDate = new Date(event.date);
      }
      
      if (isNaN(eventDate.getTime())) return true; // Invalid dates are shown
      
      // For multi-day events, check if the end date is today or in the future
      if (event.endDate) {
        let endDate;
        if (event.endDate.includes('/')) {
          const [day, month, year] = event.endDate.split('/');
          endDate = new Date(`${year}-${month}-${day}`);
        } else {
          endDate = new Date(event.endDate);
        }
        
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999); // End of day
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return endDate >= today;
        }
      }
      
      // For single-day events, check if the date is today or in the future
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return true; // On error, show the event
    }
  };

  // Apply type filter first
  const typeFilteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => {
        const eventType = (event.type || '').toLowerCase().trim();
        if (filter === 'event') return eventType === 'event' || eventType === '';
        if (filter === 'hackathon') return eventType === 'hackathon';
        if (filter === 'scholarship') return eventType === 'scholarship';
        return true;
      });

  // Apply date filter only for timeline view (calendar shows all events)
  const filteredEvents = view === 'timeline'
    ? typeFilteredEvents.filter(isEventTodayOrFuture)
    : typeFilteredEvents;

  // Initialize selected month/year when switching to calendar view or when events change
  useEffect(() => {
    if (view === 'calendar') {
      if (calendarView === 'month' && (selectedMonth === null || selectedYear === null)) {
        const defaultMonthYear = getDefaultMonthYear(filteredEvents);
        setSelectedMonth(defaultMonthYear.displayMonth);
        setSelectedYear(defaultMonthYear.displayYear);
      } else if (calendarView === 'week' && selectedWeekStart === null) {
        setSelectedWeekStart(getWeekStart(new Date()));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, calendarView, filteredEvents]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      // Handle dd/mm/yyyy format
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Handle ISO format
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTimelineDate = (dateString) => {
    if (!dateString) return null;
    try {
      let date;
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dateString);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(date);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['JAN.', 'FEB.', 'MAR', 'APR.', 'MAY', 'JUN', 'JUL', 'AUG.', 'SEPT.', 'OCT.', 'NOV.', 'DEC.'];
      
      const dayName = dayNames[date.getDay()];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      
      if (diffDays === 0) {
        return { label: 'Today', sublabel: dayName, date: date };
      } else if (diffDays === 1) {
        return { label: 'Tomorrow', sublabel: dayName, date: date };
      } else {
        return { label: `${day}. ${month}`, sublabel: dayName, date: date };
      }
    } catch {
      return null;
    }
  };

  const groupEventsByDate = (events) => {
    const grouped = {};
    events.forEach(event => {
      if (!event.date) {
        if (!grouped['no-date']) {
          grouped['no-date'] = [];
        }
        grouped['no-date'].push(event);
        return;
      }
      
      try {
        let date;
        if (event.date.includes('/')) {
          const [day, month, year] = event.date.split('/');
          date = new Date(`${year}-${month}-${day}`);
        } else {
          date = new Date(event.date);
        }
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      } catch {
        if (!grouped['no-date']) {
          grouped['no-date'] = [];
        }
        grouped['no-date'].push(event);
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped)
      .filter(key => key !== 'no-date')
      .sort((a, b) => new Date(a) - new Date(b));
    
    // Return sorted array of { date, events }
    const result = sortedDates.map(dateKey => ({
      dateKey,
      date: new Date(dateKey),
      events: grouped[dateKey].sort((a, b) => {
        // Sort by time if available
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      })
    }));
    
    // Add no-date events at the end
    if (grouped['no-date']) {
      result.push({
        dateKey: 'no-date',
        date: null,
        events: grouped['no-date']
      });
    }
    
    return result;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'hackathon':
        return BoltIcon;
      case 'scholarship':
        return SparklesIcon;
      default:
        return CalendarIcon;
    }
  };

  // Get the default month/year to display (always current month)
  const getDefaultMonthYear = (events) => {
    const today = new Date();
    const displayMonth = today.getMonth();
    const displayYear = today.getFullYear();
    
    return { displayMonth, displayYear };
  };

  // Helper function to get events for a specific date (handles multi-day events)
  const getEventsForDate = (events, date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Normalize the target date
    const currentDay = new Date(year, month, day);
    currentDay.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      if (!event.date) return false;
      try {
        // Parse start date
        let eventStartDate;
        const dateStr = String(event.date).trim();
        
        // Handle different date formats
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts.map(p => parseInt(p.trim(), 10));
            if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
            eventStartDate = new Date(y, m - 1, d);
          } else {
            return false;
          }
        } else if (dateStr.includes('-')) {
          const dateOnly = dateStr.split('T')[0].split(' ')[0];
          const parts = dateOnly.split('-').map(p => parseInt(p.trim(), 10));
          if (parts.length === 3 && !parts.some(isNaN)) {
            const [y, m, d] = parts;
            eventStartDate = new Date(y, m - 1, d);
          } else {
            eventStartDate = new Date(dateStr);
          }
        } else {
          eventStartDate = new Date(dateStr);
        }
        
        if (isNaN(eventStartDate.getTime())) {
          return false;
        }
        
        eventStartDate.setHours(0, 0, 0, 0);
        
        // Parse end date if it exists (for multi-day events like hackathons)
        let eventEndDate = null;
        if (event.endDate) {
          const endDateStr = String(event.endDate).trim();
          
          if (endDateStr.includes('/')) {
            const parts = endDateStr.split('/');
            if (parts.length === 3) {
              const [d, m, y] = parts.map(p => parseInt(p.trim(), 10));
              if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                eventEndDate = new Date(y, m - 1, d);
              }
            }
          } else if (endDateStr.includes('-')) {
            const dateOnly = endDateStr.split('T')[0].split(' ')[0];
            const parts = dateOnly.split('-').map(p => parseInt(p.trim(), 10));
            if (parts.length === 3 && !parts.some(isNaN)) {
              const [y, m, d] = parts;
              eventEndDate = new Date(y, m - 1, d);
            } else {
              eventEndDate = new Date(endDateStr);
            }
          } else {
            eventEndDate = new Date(endDateStr);
          }
          
          if (eventEndDate && !isNaN(eventEndDate.getTime())) {
            eventEndDate.setHours(0, 0, 0, 0);
          } else {
            eventEndDate = null;
          }
        }
        
        // Check if current day falls within the event date range
        if (eventEndDate) {
          // Multi-day event: check if current day is between start and end (inclusive)
          return currentDay >= eventStartDate && currentDay <= eventEndDate;
        } else {
          // Single-day event: check if it matches the start date
          const eventYear = eventStartDate.getFullYear();
          const eventMonth = eventStartDate.getMonth();
          const eventDay = eventStartDate.getDate();
          
          return eventYear === year && eventMonth === month && eventDay === day;
        }
      } catch (err) {
        return false;
      }
    });
  };

  // Helper function to sort events by time within a day
  const sortEventsByTime = (events) => {
    return [...events].sort((a, b) => {
      // Events with time come first
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      
      // Both have time - sort by time
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      
      // Neither has time - sort by name
      if (!a.time && !b.time) {
        return (a.name || '').localeCompare(b.name || '');
      }
      
      return 0;
    });
  };

  // Get the start of the week (Monday) for a given date
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Get calendar week view
  const getCalendarWeek = (events, weekStartDate) => {
    let weekStart;
    if (weekStartDate) {
      weekStart = new Date(weekStartDate);
      weekStart.setHours(0, 0, 0, 0);
    } else {
      weekStart = getWeekStart(new Date());
    }
    
    const calendar = [];
    const currentWeek = [];
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayEvents = getEventsForDate(events, date);
      currentWeek.push({ day: date.getDate(), date, events: dayEvents });
    }
    
    calendar.push(currentWeek);
    
    return { calendar, weekStart };
  };

  const getCalendarMonth = (events, month, year) => {
    // Use provided month/year or default
    let displayMonth, displayYear;
    if (month !== null && month !== undefined && year !== null && year !== undefined) {
      displayMonth = month;
      displayYear = year;
    } else {
      const defaultMonthYear = getDefaultMonthYear(events);
      displayMonth = defaultMonthYear.displayMonth;
      displayYear = defaultMonthYear.displayYear;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Convert from Sunday-first (0-6) to Monday-first (0-6)
    // Sunday (0) becomes 6, Monday (1) becomes 0, etc.
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    // Create calendar grid
    const calendar = [];
    let currentWeek = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayYear, displayMonth, day);
      const dayEvents = getEventsForDate(events, date);
      currentWeek.push({ day, date, events: dayEvents });
      
      // Start new week on Monday (7 days per week)
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining empty cells for last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendar.push(currentWeek);
    }
    
    return { calendar, month: displayMonth, year: displayYear };
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'hackathon':
        return 'Hackathon';
      case 'scholarship':
        return 'Scholarship';
      default:
        return 'Event';
    }
  };

  // Helper function to determine event position in multi-day span
  const getEventPosition = (event, currentDate) => {
    if (!event.endDate) {
      return 'single'; // Single day event
    }

    try {
      // Parse start date
      let eventStartDate;
      const dateStr = String(event.date).trim();
      
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(p => parseInt(p.trim(), 10));
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            eventStartDate = new Date(y, m - 1, d);
          }
        }
      } else if (dateStr.includes('-')) {
        const dateOnly = dateStr.split('T')[0].split(' ')[0];
        const parts = dateOnly.split('-').map(p => parseInt(p.trim(), 10));
        if (parts.length === 3 && !parts.some(isNaN)) {
          const [y, m, d] = parts;
          eventStartDate = new Date(y, m - 1, d);
        } else {
          eventStartDate = new Date(dateStr);
        }
      } else {
        eventStartDate = new Date(dateStr);
      }

      // Parse end date
      let eventEndDate;
      const endDateStr = String(event.endDate).trim();
      
      if (endDateStr.includes('/')) {
        const parts = endDateStr.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(p => parseInt(p.trim(), 10));
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            eventEndDate = new Date(y, m - 1, d);
          }
        }
      } else if (endDateStr.includes('-')) {
        const dateOnly = endDateStr.split('T')[0].split(' ')[0];
        const parts = dateOnly.split('-').map(p => parseInt(p.trim(), 10));
        if (parts.length === 3 && !parts.some(isNaN)) {
          const [y, m, d] = parts;
          eventEndDate = new Date(y, m - 1, d);
        } else {
          eventEndDate = new Date(endDateStr);
        }
      } else {
        eventEndDate = new Date(endDateStr);
      }

      if (!eventStartDate || !eventEndDate || isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
        return 'single';
      }

      // Normalize dates
      currentDate.setHours(0, 0, 0, 0);
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      // Check if current date matches start, end, or is in between
      if (currentDate.getTime() === eventStartDate.getTime()) {
        return eventStartDate.getTime() === eventEndDate.getTime() ? 'single' : 'start';
      } else if (currentDate.getTime() === eventEndDate.getTime()) {
        return 'end';
      } else if (currentDate > eventStartDate && currentDate < eventEndDate) {
        return 'middle';
      }
    } catch (err) {
      return 'single';
    }

    return 'single';
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StaticBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar 
          onJoinClick={() => setIsModalOpen(true)} 
          onPartnersClick={() => {}}
        />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative z-10 w-full pt-24 pb-4 sm:pt-28 sm:pb-6 lg:pt-32 lg:pb-8">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center"
              >
                <p className="label-section">Events & Opportunities</p>
                <h1 className="heading-1 mt-4">
                  Discover Events, Hackathons & Scholarships
                </h1>
                <p className="body-hero mt-6">
                  Explore upcoming tech events, hackathons, and scholarship opportunities in Bavaria.
                </p>
              </motion.div>

              {/* Join Community Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-12 flex justify-center"
              >
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-6 py-2.5 text-sm font-medium text-[#020817]/90 transition-all duration-300 hover:bg-white hover:border-white/40"
                >
                  <span>Join the Community</span>
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>

              {/* Separator and Filter Buttons Container */}
              <div className="mt-6 flex flex-col items-center">
                {/* Filter Buttons - Using inline-flex so container shrinks to content width */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex flex-col items-center"
                >
                  {/* Separator - Will match the width of the button container */}
                  <div className="mb-4 w-full h-px bg-white/20"></div>
                  
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                {[
                  { key: 'all', label: 'All', icon: CalendarIcon },
                  { key: 'event', label: 'Events', icon: CalendarIcon },
                  { key: 'hackathon', label: 'Hackathons', icon: BoltIcon },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                      filter === key
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Events Grid */}
          <section className="relative z-10 w-full pt-4 pb-24 sm:pt-6 sm:pb-28 lg:pt-8 lg:pb-32">
            {/* View Toggle Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className={`mb-6 flex justify-end gap-2 px-4 sm:px-6 ${
                view === 'calendar' ? 'w-full max-w-7xl mx-auto' : 'section-container'
              }`}
            >
              <button
                onClick={() => setView('timeline')}
                className={`flex items-center justify-center rounded-full border p-2.5 transition-all duration-200 ${
                  view === 'timeline'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                }`}
                title="Timeline View"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center justify-center rounded-full border p-2.5 transition-all duration-200 ${
                  view === 'calendar'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                }`}
                title="Calendar View"
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </motion.div>
            {loading ? (
              <div className="section-container">
                <div className="flex justify-center py-20">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
                    <p className="body-subtle">Loading events...</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="section-container">
                <div className="glass-card text-center">
                  <p className="body-section text-red-400">{error}</p>
                  <button
                    onClick={fetchEvents}
                    className="btn-secondary mt-4"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="section-container">
                <div className="glass-card text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="icon-bubble">
                      <CalendarIcon className="h-8 w-8 text-cyan-300" />
                    </div>
                  </div>
                  <h3 className="heading-3 mb-4">No Events Found</h3>
                  <p className="body-section">
                    {filter === 'all' 
                      ? 'There are no events available at the moment. Check back soon!'
                      : `No ${filter === 'event' ? 'events' : filter === 'hackathon' ? 'hackathons' : 'scholarships'} available at the moment.`
                    }
                  </p>
                </div>
              </div>
            ) : view === 'calendar' ? (
              <div className="w-full px-4 sm:px-6">
                <div className="glass-card p-4 sm:p-6 mb-6 w-full max-w-7xl mx-auto">
                    {(() => {
                      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      
                      // Calendar view toggle buttons
                      const CalendarViewToggle = () => (
                        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                          <button
                            onClick={() => setCalendarView('month')}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                              calendarView === 'month'
                                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            <Squares2X2Icon className="h-4 w-4" />
                            Month
                          </button>
                          <button
                            onClick={() => setCalendarView('week')}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                              calendarView === 'week'
                                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            <CalendarIcon className="h-4 w-4" />
                            Week
                          </button>
                        </div>
                      );
                      
                      if (calendarView === 'month') {
                        const { calendar, month, year } = getCalendarMonth(filteredEvents, selectedMonth, selectedYear);
                        
                        const handlePreviousMonth = () => {
                          let currentMonth = selectedMonth !== null ? selectedMonth : month;
                          let currentYear = selectedYear !== null ? selectedYear : year;
                          let newMonth = currentMonth - 1;
                          let newYear = currentYear;
                          if (newMonth < 0) {
                            newMonth = 11;
                            newYear -= 1;
                          }
                          setSelectedMonth(newMonth);
                          setSelectedYear(newYear);
                        };
                        
                        const handleNextMonth = () => {
                          let currentMonth = selectedMonth !== null ? selectedMonth : month;
                          let currentYear = selectedYear !== null ? selectedYear : year;
                          let newMonth = currentMonth + 1;
                          let newYear = currentYear;
                          if (newMonth > 11) {
                            newMonth = 0;
                            newYear += 1;
                          }
                          setSelectedMonth(newMonth);
                          setSelectedYear(newYear);
                        };
                        
                        return (
                          <>
                            <CalendarViewToggle />
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <button
                                onClick={handlePreviousMonth}
                                className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-1.5 sm:p-2 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label="Previous month"
                              >
                                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <h2 className="heading-3 text-center text-lg sm:text-xl md:text-2xl px-2">
                                {monthNames[month]} {year}
                              </h2>
                              <button
                                onClick={handleNextMonth}
                                className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-1.5 sm:p-2 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label="Next month"
                              >
                                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            </div>
                            {/* Calendar Header */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                              {dayNames.map(day => (
                                <div key={day} className="text-center text-xs sm:text-sm font-medium text-white/60 py-1 sm:py-2">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                              {calendar.map((week, weekIndex) =>
                                week.map((day, dayIndex) => {
                                  if (!day) {
                                    return <div key={`${weekIndex}-${dayIndex}`} className="min-h-[80px] sm:min-h-[120px] md:min-h-[150px]"></div>;
                                  }
                                  
                                  const isToday = day.date.toDateString() === new Date().toDateString();
                                  
                                  return (
                                    <div
                                      key={`${day.day}-${weekIndex}`}
                                      className={`min-h-[80px] sm:min-h-[120px] md:min-h-[150px] flex flex-col rounded-lg border p-1 sm:p-2 transition-all duration-200 ${
                                        isToday
                                          ? 'border-cyan-400 bg-cyan-400/20'
                                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                      }`}
                                    >
                                      <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex-shrink-0 ${
                                        isToday ? 'text-cyan-300' : 'text-white/70'
                                      }`}>
                                        {day.day}
                                      </div>
                                      <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-y-auto">
                                        {sortEventsByTime(day.events).slice(0, 3).map(event => {
                                          const isHackathon = event.type === 'hackathon';
                                          const eventPosition = getEventPosition(event, new Date(day.date));
                                          const isMultiDay = eventPosition !== 'single';
                                          
                                          // Generate a consistent color hash for multi-day events
                                          const getEventColorId = (eventId) => {
                                            let hash = 0;
                                            for (let i = 0; i < eventId.length; i++) {
                                              hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
                                            }
                                            return Math.abs(hash) % 6; // 6 different color variants
                                          };
                                          
                                          const colorId = isMultiDay ? getEventColorId(event.id) : null;
                                          const colorVariants = [
                                            { bg: 'bg-sky-500/30', text: 'text-sky-200', textTime: 'text-sky-300/80', hover: 'hover:bg-sky-500/40', border: 'border-sky-400' },
                                            { bg: 'bg-purple-500/30', text: 'text-purple-200', textTime: 'text-purple-300/80', hover: 'hover:bg-purple-500/40', border: 'border-purple-400' },
                                            { bg: 'bg-pink-500/30', text: 'text-pink-200', textTime: 'text-pink-300/80', hover: 'hover:bg-pink-500/40', border: 'border-pink-400' },
                                            { bg: 'bg-orange-500/30', text: 'text-orange-200', textTime: 'text-orange-300/80', hover: 'hover:bg-orange-500/40', border: 'border-orange-400' },
                                            { bg: 'bg-emerald-500/30', text: 'text-emerald-200', textTime: 'text-emerald-300/80', hover: 'hover:bg-emerald-500/40', border: 'border-emerald-400' },
                                            { bg: 'bg-indigo-500/30', text: 'text-indigo-200', textTime: 'text-indigo-300/80', hover: 'hover:bg-indigo-500/40', border: 'border-indigo-400' },
                                          ];
                                          
                                          const colors = isMultiDay && colorId !== null 
                                            ? colorVariants[colorId]
                                            : isHackathon
                                              ? { bg: 'bg-sky-500/30', text: 'text-sky-200', textTime: 'text-sky-300/80', hover: 'hover:bg-sky-500/40', border: 'border-sky-400' }
                                              : { bg: 'bg-cyan-400/30', text: 'text-cyan-200', textTime: 'text-cyan-300/80', hover: 'hover:bg-cyan-400/40', border: 'border-cyan-400' };
                                          
                                          // Determine border classes based on position
                                          let borderClasses = '';
                                          if (isMultiDay) {
                                            if (eventPosition === 'start') {
                                              borderClasses = `border-l-2 ${colors.border} rounded-l-md rounded-r-sm`;
                                            } else if (eventPosition === 'end') {
                                              borderClasses = `border-r-2 ${colors.border} rounded-r-md rounded-l-sm`;
                                            } else if (eventPosition === 'middle') {
                                              borderClasses = `border-l-2 border-r-2 ${colors.border} rounded-none`;
                                            }
                                          } else {
                                            borderClasses = 'rounded';
                                          }
                                          
                                          return (
                                            <div
                                              key={event.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(event);
                                                setIsEventModalOpen(true);
                                              }}
                                              className={`text-[10px] sm:text-xs px-1 sm:px-2 py-1 sm:py-1.5 cursor-pointer flex flex-col relative ${colors.bg} ${colors.text} ${colors.hover} ${borderClasses} ${
                                                isMultiDay ? 'border-t border-b' : ''
                                              }`}
                                              title={event.name}
                                            >
                                              {isMultiDay && eventPosition === 'start' && (
                                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 border border-white/60"></div>
                                              )}
                                              {isMultiDay && eventPosition === 'end' && (
                                                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 border border-white/60"></div>
                                              )}
                                              <div className="font-medium line-clamp-1 sm:line-clamp-2 mb-0.5 relative z-10">
                                                {event.name}
                                              </div>
                                              {event.time && (
                                                <div className={`text-[9px] sm:text-[10px] ${colors.textTime} relative z-10`}>
                                                  {event.time}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                        {day.events.length > 3 && (
                                          <div className="text-[10px] sm:text-xs text-white/50 px-1 sm:px-2">
                                            +{day.events.length - 3} more
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      } else {
                        // Week view
                        const currentWeekStart = selectedWeekStart || getWeekStart(new Date());
                        const { calendar, weekStart } = getCalendarWeek(filteredEvents, currentWeekStart);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        
                        const formatWeekRange = (start, end) => {
                          const startMonth = monthNames[start.getMonth()];
                          const endMonth = monthNames[end.getMonth()];
                          const startDay = start.getDate();
                          const endDay = end.getDate();
                          const year = start.getFullYear();
                          
                          if (startMonth === endMonth) {
                            return `${startMonth} ${startDay} - ${endDay}, ${year}`;
                          } else {
                            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
                          }
                        };
                        
                        const handlePreviousWeek = () => {
                          const newWeekStart = new Date(currentWeekStart);
                          newWeekStart.setDate(newWeekStart.getDate() - 7);
                          setSelectedWeekStart(newWeekStart);
                        };
                        
                        const handleNextWeek = () => {
                          const newWeekStart = new Date(currentWeekStart);
                          newWeekStart.setDate(newWeekStart.getDate() + 7);
                          setSelectedWeekStart(newWeekStart);
                        };
                        
                        return (
                          <>
                            <CalendarViewToggle />
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <button
                                onClick={handlePreviousWeek}
                                className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-1.5 sm:p-2 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label="Previous week"
                              >
                                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <h2 className="heading-3 text-center text-lg sm:text-xl md:text-2xl px-2">
                                {formatWeekRange(weekStart, weekEnd)}
                              </h2>
                              <button
                                onClick={handleNextWeek}
                                className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-1.5 sm:p-2 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                aria-label="Next week"
                              >
                                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            </div>
                            {/* Calendar Header - Hidden on mobile, shown on larger screens */}
                            <div className="hidden sm:grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                              {dayNames.map(day => (
                                <div key={day} className="text-center text-xs sm:text-sm font-medium text-white/60 py-1 sm:py-2">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* Calendar Grid - Week View - Stacks vertically on mobile */}
                            <div className="flex flex-col sm:grid sm:grid-cols-7 gap-2 sm:gap-1 md:gap-2">
                              {calendar[0].map((day, dayIndex) => {
                                const isToday = day.date.toDateString() === new Date().toDateString();
                                const monthName = monthNames[day.date.getMonth()].substring(0, 3);
                                const dayName = dayNames[dayIndex];
                                
                                return (
                                  <div
                                    key={`week-${day.day}-${dayIndex}`}
                                    className={`min-h-[150px] sm:min-h-[300px] md:min-h-[400px] flex flex-col rounded-lg border p-2 sm:p-3 transition-all duration-200 ${
                                      isToday
                                        ? 'border-cyan-400 bg-cyan-400/20'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 flex-shrink-0 ${
                                      isToday ? 'text-cyan-300' : 'text-white/70'
                                    }`}>
                                      <div className="flex items-center justify-between sm:block">
                                        <div className="flex items-center gap-2">
                                          <div>{day.day}</div>
                                          <div className="text-xs text-white/50">{monthName}</div>
                                        </div>
                                        <div className="text-xs sm:hidden text-white/50 font-normal">{dayName}</div>
                                      </div>
                                    </div>
                                    <div className="flex-1 space-y-2 overflow-y-auto">
                                      {sortEventsByTime(day.events).map(event => {
                                        const isHackathon = event.type === 'hackathon';
                                        return (
                                          <div
                                            key={event.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedEvent(event);
                                              setIsEventModalOpen(true);
                                            }}
                                            className={`text-xs sm:text-sm px-2 sm:px-3 py-2 rounded cursor-pointer flex flex-col ${
                                              isHackathon
                                                ? 'bg-sky-500/30 text-sky-200 hover:bg-sky-500/40'
                                                : 'bg-cyan-400/30 text-cyan-200 hover:bg-cyan-400/40'
                                            }`}
                                            title={event.name}
                                          >
                                            <div className="font-medium line-clamp-2 mb-1">
                                              {event.name}
                                            </div>
                                            {event.time && (
                                              <div className={`text-[10px] sm:text-xs ${
                                                isHackathon ? 'text-sky-300/80' : 'text-cyan-300/80'
                                              }`}>
                                                {event.time}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {day.events.length === 0 && (
                                        <div className="text-xs text-white/30 text-center py-4">
                                          No events
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      }
                    })()}
                          </div>

                  {/* Events without dates */}
                  {filteredEvents.filter(e => !e.date).length > 0 && (
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
                      <div className="glass-card p-4 sm:p-6">
                        <h3 className="heading-3 mb-4">Events Without Date</h3>
                        <div className="space-y-4">
                          {filteredEvents.filter(e => !e.date).map((event, index) => {
                            const globalIndex = filteredEvents.findIndex(e => e.id === event.id);
                            const isHackathon = event.type === 'hackathon';
                            const isHighlighted = event.isHighlight === true;
                            
                            // Determine card class based on type and highlight status
                            let cardClass = 'event-card'; // Default for regular events
                            if (isHackathon) {
                              cardClass = 'hackathon-card';
                            } else if (isHighlighted) {
                              cardClass = 'highlighted-event-card';
                            }
                            
                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className={`${cardClass} group relative overflow-hidden cursor-pointer`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsEventModalOpen(true);
                                }}
                              >
                                <h3 className="heading-3 mb-4">
                                  {event.name}
                                </h3>
                                <div className="space-y-2">
                                  {event.organizer && (
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                                      <span>By {event.organizer}</span>
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                                <motion.div
                                  className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: globalIndex * 0.2 }}
                                />
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="section-container">
                  <div className="relative">
                  {groupEventsByDate(filteredEvents).map((dateGroup, groupIndex) => {
                    const timelineDate = dateGroup.dateKey !== 'no-date' 
                      ? formatTimelineDate(dateGroup.events[0]?.date) 
                      : null;
                    
                    return (
                      <div key={dateGroup.dateKey} className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                        {/* Timeline Left Side - Date */}
                        <div className="flex-shrink-0 w-full sm:w-32 md:w-40">
                          {/* Date Label */}
                          {timelineDate ? (
                            <div className="text-left sm:text-right pr-0 sm:pr-4">
                              <div className="label-form text-xs text-white/60 mb-1 uppercase">
                                {timelineDate.label}
                              </div>
                              <div className="body-section text-sm text-white/70">
                                {timelineDate.sublabel}
                              </div>
                            </div>
                          ) : (
                            <div className="text-left sm:text-right pr-0 sm:pr-4">
                              <div className="body-section text-sm text-white/60">
                                Date TBA
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Timeline Right Side - Events */}
                        <div className="flex-1 pb-6 sm:pb-8 w-full">
                          <div className="space-y-4">
                            {dateGroup.events.map((event, eventIndex) => {
                              const globalIndex = filteredEvents.findIndex(e => e.id === event.id);
                              const isHackathon = event.type === 'hackathon';
                              const isHighlighted = event.isHighlight === true;
                              
                              // Determine card class based on type and highlight status
                              let cardClass = 'event-card'; // Default for regular events
                              if (isHackathon) {
                                cardClass = 'hackathon-card';
                              } else if (isHighlighted) {
                                cardClass = 'highlighted-event-card';
                              }
                              
                              return (
                                <motion.div
                                  key={event.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.4, delay: (groupIndex * 0.1) + (eventIndex * 0.05) }}
                                  className={`${cardClass} group relative overflow-hidden cursor-pointer`}
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setIsEventModalOpen(true);
                                  }}
                                >
                                  {/* Event Time */}
                                  {event.time && (
                                    <div className="text-sm text-cyan-300 font-medium mb-2">
                                      {event.time}
                              </div>
                            )}

                                  {/* Event Name */}
                                  <h3 className="heading-3 mb-4">
                                    {event.name}
                                  </h3>

                                  {/* Event Details */}
                                  <div className="space-y-2">
                            {event.organizer && (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                                        <span>By {event.organizer}</span>
                                      </div>
                                    )}
                                    {event.location && (
                                      <div className="flex items-center gap-2 text-sm text-white/70">
                                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                        <span>{event.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover Effect */}
                          <motion.div
                            className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: globalIndex * 0.2 }}
                          />
                        </motion.div>
                      );
                    })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
          </section>
        </main>
      </div>
      
      <AnimatePresence mode="wait">
        {isModalOpen && <JoinModal key="join-modal" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>

      {/* Event Detail Modal */}
      {isEventModalOpen && selectedEvent && (
        <Dialog 
          open={isEventModalOpen} 
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }} 
          className="relative z-50"
        >
            <motion.div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              style={{ willChange: 'opacity' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={() => {
                setIsEventModalOpen(false);
                setSelectedEvent(null);
              }}
            />

            <div className="fixed inset-0 overflow-y-auto" onClick={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(null);
            }}>
              <div className="flex min-h-full items-center justify-center px-6 py-16">
                <motion.div
                  style={{ willChange: 'transform, opacity' }}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="glass-card relative w-full max-w-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEventModalOpen(false);
                        setSelectedEvent(null);
                      }}
                      aria-label="Close"
                      className="absolute top-0 right-0 z-10 h-8 w-8 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    
                    <Dialog.Title className="heading-3 pr-12 mb-6">
                      {selectedEvent.name}
                    </Dialog.Title>
                  </div>

                  <div className="space-y-6">
                    {/* Event Details */}
                    <div className="space-y-4">
                      {selectedEvent.date && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Date & Time</p>
                            <p className="body-section">
                              {formatDate(selectedEvent.date)}
                              {selectedEvent.time && ` at ${selectedEvent.time}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.location && (
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Location</p>
                            <p className="body-section">{selectedEvent.location}</p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.organizer && (
                        <div className="flex items-start gap-3">
                          <UserGroupIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Organizer</p>
                            <p className="body-section">{selectedEvent.organizer}</p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.format && (
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Format</p>
                            <p className="body-section">{selectedEvent.format}</p>
                          </div>
                        </div>
                      )}

                      {/* Hackathon-specific fields */}
                      {selectedEvent.type === 'hackathon' && selectedEvent.prizes && (
                        <div className="flex items-start gap-3">
                          <SparklesIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Prizes</p>
                            <p className="body-section">{selectedEvent.prizes}</p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.type === 'hackathon' && selectedEvent.endDate && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">End Date & Time</p>
                            <p className="body-section">
                              {formatDate(selectedEvent.endDate)}
                              {selectedEvent.endTime && ` at ${selectedEvent.endTime}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.type === 'hackathon' && selectedEvent.signupDeadline && (
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Signup Deadline</p>
                            <p className="body-section">{formatDate(selectedEvent.signupDeadline)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedEvent.description && (
                      <div>
                        <p className="label-form text-xs mb-2">Description</p>
                        <p className="body-section whitespace-pre-wrap">{selectedEvent.description}</p>
                      </div>
                    )}

                    {/* Link to Organization/Event */}
                    {selectedEvent.link && (
                      <div className="pt-4 border-t border-white/10">
                        <a
                          href={selectedEvent.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <span>Visit Event Page</span>
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </Dialog>
      )}
    </div>
  );
};

export default Students;
