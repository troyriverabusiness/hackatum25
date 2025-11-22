import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, XMarkIcon, Squares2X2Icon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const HackathonsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('timeline'); // 'timeline' or 'calendar'
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(null);

  const fetchHackathons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from hackathons table
      const { data, error: fetchError } = await supabase
        .from('hackathons')
        .select('*')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedHackathons = (data || []).map(hackathon => ({
        id: hackathon.id,
        name: hackathon.name,
        type: 'hackathon',
        date: hackathon.start_date || null,
        time: hackathon.start_time || null,
        description: hackathon.description || null,
        link: hackathon.link || null,
        organizer: hackathon.organisers || null,
        location: hackathon.location || null,
        prizes: hackathon.prizes || null,
        endDate: hackathon.end_date || null,
        endTime: hackathon.end_time || null,
        signupDeadline: hackathon.signup_deadline || null,
        isHighlight: hackathon.is_highlight || false,
        createdAt: hackathon.created_at,
      }));

      setHackathons(transformedHackathons);
    } catch (err) {
      console.error('Error fetching hackathons:', err);
      setError('Failed to load hackathons. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHackathons();

    // Set up real-time subscription
    const channel = supabase
      .channel('hackathons_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hackathons',
        },
        () => {
          fetchHackathons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHackathons]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
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

  // Initialize selected month/year when switching to calendar view or when events change
  useEffect(() => {
    if (view === 'calendar') {
      if (calendarView === 'month' && (selectedMonth === null || selectedYear === null)) {
        const defaultMonthYear = getDefaultMonthYear(hackathons);
        setSelectedMonth(defaultMonthYear.displayMonth);
        setSelectedYear(defaultMonthYear.displayYear);
      } else if (calendarView === 'week' && selectedWeekStart === null) {
        setSelectedWeekStart(getWeekStart(new Date()));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, calendarView, hackathons]);

  if (loading) {
    return (
      <div className="section-container">
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
            <p className="body-subtle">Loading hackathons...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-container">
        <div className="glass-card text-center">
          <p className="body-section text-red-400">{error}</p>
          <button
            onClick={fetchHackathons}
            className="btn-secondary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (hackathons.length === 0) {
    return (
      <div className="section-container">
        <div className="glass-card text-center">
          <div className="mb-4 flex justify-center">
            <div className="icon-bubble">
              <SparklesIcon className="h-8 w-8 text-purple-300" />
            </div>
          </div>
          <h3 className="heading-3 mb-4">No Hackathons Found</h3>
          <p className="body-section">
            There are no hackathons available at the moment. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'calendar' ? (
        <div className="w-full px-4 sm:px-6 mt-6">
          {/* View toggle buttons */}
          <div className="flex justify-end gap-2 mb-6 w-full max-w-7xl mx-auto">
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center justify-center rounded-full border p-2.5 transition-all duration-200 ${
                view === 'timeline'
                  ? 'border-purple-400 bg-purple-400/20 text-purple-300'
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
                  ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                  : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
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
                        ? 'border-purple-400 bg-purple-400/20 text-purple-300'
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
                        ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Week
                  </button>
                </div>
              );
              
              if (calendarView === 'month') {
                const { calendar, month, year } = getCalendarMonth(hackathons, selectedMonth, selectedYear);
                
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
                                  ? 'border-purple-400 bg-purple-400/20'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex-shrink-0 ${
                                isToday ? 'text-purple-300' : 'text-white/70'
                              }`}>
                                {day.day}
                              </div>
                              <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-y-auto">
                                {sortEventsByTime(day.events).slice(0, 3).map(hackathon => {
                                  const eventPosition = getEventPosition(hackathon, new Date(day.date));
                                  const isMultiDay = eventPosition !== 'single';
                                  
                                  // Generate a consistent color hash for multi-day events
                                  const getEventColorId = (eventId) => {
                                    let hash = 0;
                                    for (let i = 0; i < eventId.length; i++) {
                                      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
                                    }
                                    return Math.abs(hash) % 6; // 6 different color variants
                                  };
                                  
                                  const colorId = isMultiDay ? getEventColorId(hackathon.id) : null;
                                  const colorVariants = [
                                    { bg: 'bg-purple-500/30', text: 'text-purple-200', textTime: 'text-purple-300/80', hover: 'hover:bg-purple-500/40', border: 'border-purple-400' },
                                    { bg: 'bg-sky-500/30', text: 'text-sky-200', textTime: 'text-sky-300/80', hover: 'hover:bg-sky-500/40', border: 'border-sky-400' },
                                    { bg: 'bg-pink-500/30', text: 'text-pink-200', textTime: 'text-pink-300/80', hover: 'hover:bg-pink-500/40', border: 'border-pink-400' },
                                    { bg: 'bg-orange-500/30', text: 'text-orange-200', textTime: 'text-orange-300/80', hover: 'hover:bg-orange-500/40', border: 'border-orange-400' },
                                    { bg: 'bg-emerald-500/30', text: 'text-emerald-200', textTime: 'text-emerald-300/80', hover: 'hover:bg-emerald-500/40', border: 'border-emerald-400' },
                                    { bg: 'bg-indigo-500/30', text: 'text-indigo-200', textTime: 'text-indigo-300/80', hover: 'hover:bg-indigo-500/40', border: 'border-indigo-400' },
                                  ];
                                  
                                  const colors = isMultiDay && colorId !== null 
                                    ? colorVariants[colorId]
                                    : { bg: 'bg-purple-500/30', text: 'text-purple-200', textTime: 'text-purple-300/80', hover: 'hover:bg-purple-500/40', border: 'border-purple-400' };
                                  
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
                                      key={hackathon.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHackathon(hackathon);
                                        setIsModalOpen(true);
                                      }}
                                      className={`text-[10px] sm:text-xs px-1 sm:px-2 py-1 sm:py-1.5 cursor-pointer flex flex-col relative ${colors.bg} ${colors.text} ${colors.hover} ${borderClasses} ${
                                        isMultiDay ? 'border-t border-b' : ''
                                      }`}
                                      title={hackathon.name}
                                    >
                                      {isMultiDay && eventPosition === 'start' && (
                                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 border border-white/60"></div>
                                      )}
                                      {isMultiDay && eventPosition === 'end' && (
                                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 border border-white/60"></div>
                                      )}
                                      <div className="font-medium line-clamp-1 sm:line-clamp-2 mb-0.5 relative z-10">
                                        {hackathon.name}
                                      </div>
                                      {hackathon.time && (
                                        <div className={`text-[9px] sm:text-[10px] ${colors.textTime} relative z-10`}>
                                          {hackathon.time}
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
                const { calendar, weekStart } = getCalendarWeek(hackathons, currentWeekStart);
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
                                ? 'border-purple-400 bg-purple-400/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <div className={`text-sm sm:text-base font-medium mb-2 sm:mb-3 flex-shrink-0 ${
                              isToday ? 'text-purple-300' : 'text-white/70'
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
                              {sortEventsByTime(day.events).map(hackathon => {
                                return (
                                  <div
                                    key={hackathon.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedHackathon(hackathon);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-2 rounded cursor-pointer flex flex-col bg-purple-500/30 text-purple-200 hover:bg-purple-500/40"
                                    title={hackathon.name}
                                  >
                                    <div className="font-medium line-clamp-2 mb-1">
                                      {hackathon.name}
                                    </div>
                                    {hackathon.time && (
                                      <div className="text-[10px] sm:text-xs text-purple-300/80">
                                        {hackathon.time}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {day.events.length === 0 && (
                                <div className="text-xs text-white/30 text-center py-4">
                                  No hackathons
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
        </div>
      ) : (
        <div className="section-container mt-6">
          {/* View toggle buttons */}
          <div className="flex justify-end gap-2 mb-6">
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center justify-center rounded-full border p-2.5 transition-all duration-200 ${
                view === 'timeline'
                  ? 'border-purple-400 bg-purple-400/20 text-purple-300'
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
                  ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                  : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon, index) => (
              <motion.div
                key={hackathon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="hackathon-card group relative overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedHackathon(hackathon);
                  setIsModalOpen(true);
                }}
              >
                <h3 className="heading-3 mb-4">{hackathon.name}</h3>
                
                <div className="space-y-2">
                  {hackathon.date && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(hackathon.date)}</span>
                    </div>
                  )}
                  {hackathon.endDate && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <ClockIcon className="h-4 w-4 flex-shrink-0" />
                      <span>Ends: {formatDate(hackathon.endDate)}</span>
                    </div>
                  )}
                  {hackathon.location && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{hackathon.location}</span>
                    </div>
                  )}
                  {hackathon.prizes && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <SparklesIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{hackathon.prizes}</span>
                    </div>
                  )}
                  {hackathon.organizer && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                      <span>By {hackathon.organizer}</span>
                    </div>
                  )}
                </div>

                <motion.div
                  className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-purple-400/20 blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hackathon Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedHackathon && (
          <Dialog 
            open={isModalOpen} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedHackathon(null);
            }} 
            className="relative z-50"
          >
            <motion.div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={() => {
                setIsModalOpen(false);
                setSelectedHackathon(null);
              }}
            />

            <div className="fixed inset-0 overflow-y-auto" onClick={() => {
              setIsModalOpen(false);
              setSelectedHackathon(null);
            }}>
              <div className="flex min-h-full items-center justify-center px-6 py-16">
                <motion.div
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
                        setIsModalOpen(false);
                        setSelectedHackathon(null);
                      }}
                      aria-label="Close"
                      className="absolute top-0 right-0 z-10 h-8 w-8 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    
                    <Dialog.Title className="heading-3 pr-12 mb-6">
                      {selectedHackathon.name}
                    </Dialog.Title>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      {selectedHackathon.date && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Start Date & Time</p>
                            <p className="body-section">
                              {formatDate(selectedHackathon.date)}
                              {selectedHackathon.time && ` at ${selectedHackathon.time}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedHackathon.endDate && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">End Date & Time</p>
                            <p className="body-section">
                              {formatDate(selectedHackathon.endDate)}
                              {selectedHackathon.endTime && ` at ${selectedHackathon.endTime}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedHackathon.signupDeadline && (
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Signup Deadline</p>
                            <p className="body-section">{formatDate(selectedHackathon.signupDeadline)}</p>
                          </div>
                        </div>
                      )}

                      {selectedHackathon.location && (
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Location</p>
                            <p className="body-section">{selectedHackathon.location}</p>
                          </div>
                        </div>
                      )}

                      {selectedHackathon.organizer && (
                        <div className="flex items-start gap-3">
                          <UserGroupIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Organizer</p>
                            <p className="body-section">{selectedHackathon.organizer}</p>
                          </div>
                        </div>
                      )}

                      {selectedHackathon.prizes && (
                        <div className="flex items-start gap-3">
                          <SparklesIcon className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Prizes</p>
                            <p className="body-section">{selectedHackathon.prizes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedHackathon.description && (
                      <div>
                        <p className="label-form text-xs mb-2">Description</p>
                        <p className="body-section whitespace-pre-wrap">{selectedHackathon.description}</p>
                      </div>
                    )}

                    {selectedHackathon.link && (
                      <div className="pt-4 border-t border-white/10">
                        <a
                          href={selectedHackathon.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <span>Visit Hackathon Page</span>
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
      </AnimatePresence>
    </>
  );
};

export default HackathonsPage;

