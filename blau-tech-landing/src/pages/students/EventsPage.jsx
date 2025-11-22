import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, XMarkIcon, Squares2X2Icon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [view, setView] = useState('timeline'); // 'timeline' or 'calendar'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
  const [selectedWeekStart, setSelectedWeekStart] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only events (not hackathons or scholarships)
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Filter for events only (type = 'event' or no type specified)
      const filteredEvents = (data || [])
        .map(event => ({
          id: event.id,
          name: event.name,
          type: event.type || 'event',
          date: event.start_date || null,
          time: event.start_time || null,
          description: event.description || null,
          link: event.link || null,
          organizer: event.organisers || null,
          location: event.location || null,
          format: event.format || null,
          isHighlight: event.is_highlight || false,
          createdAt: event.created_at,
        }))
        .filter(event => {
          const eventType = (event.type || '').toLowerCase().trim();
          return eventType === 'event' || eventType === '';
        });

      setEvents(filteredEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Set up real-time subscription
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  // Helper function to check if an event is today or in the future
  const isEventTodayOrFuture = (event) => {
    if (!event.date) return true;
    
    try {
      let eventDate;
      if (event.date.includes('/')) {
        const [day, month, year] = event.date.split('/');
        eventDate = new Date(`${year}-${month}-${day}`);
      } else {
        eventDate = new Date(event.date);
      }
      
      if (isNaN(eventDate.getTime())) return true;
      
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return true;
    }
  };

  // Apply date filter only for timeline view (calendar shows all events)
  const filteredEvents = view === 'timeline'
    ? events.filter(isEventTodayOrFuture)
    : events;

  // Initialize selected month/year when switching to calendar view
  useEffect(() => {
    if (view === 'calendar') {
      if (calendarView === 'month' && (selectedMonth === null || selectedYear === null)) {
        const today = new Date();
        setSelectedMonth(today.getMonth());
        setSelectedYear(today.getFullYear());
      } else if (calendarView === 'week' && selectedWeekStart === null) {
        setSelectedWeekStart(getWeekStart(new Date()));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, calendarView, filteredEvents]);

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
    
    const sortedDates = Object.keys(grouped)
      .filter(key => key !== 'no-date')
      .sort((a, b) => new Date(a) - new Date(b));
    
    const result = sortedDates.map(dateKey => ({
      dateKey,
      date: new Date(dateKey),
      events: grouped[dateKey].sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      })
    }));
    
    if (grouped['no-date']) {
      result.push({
        dateKey: 'no-date',
        date: null,
        events: grouped['no-date']
      });
    }
    
    return result;
  };

  const getEventsForDate = (events, date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const currentDay = new Date(year, month, day);
    currentDay.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      if (!event.date) return false;
      try {
        let eventStartDate;
        const dateStr = String(event.date).trim();
        
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
        
        const eventYear = eventStartDate.getFullYear();
        const eventMonth = eventStartDate.getMonth();
        const eventDay = eventStartDate.getDate();
        
        return eventYear === year && eventMonth === month && eventDay === day;
      } catch (err) {
        return false;
      }
    });
  };

  const sortEventsByTime = (events) => {
    return [...events].sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (!a.time && !b.time) {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

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
    let displayMonth, displayYear;
    if (month !== null && month !== undefined && year !== null && year !== undefined) {
      displayMonth = month;
      displayYear = year;
    } else {
      const today = new Date();
      displayMonth = today.getMonth();
      displayYear = today.getFullYear();
    }
    
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const calendar = [];
    let currentWeek = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayYear, displayMonth, day);
      const dayEvents = getEventsForDate(events, date);
      currentWeek.push({ day, date, events: dayEvents });
      
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendar.push(currentWeek);
    }
    
    return { calendar, month: displayMonth, year: displayYear };
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
            <p className="body-subtle">Loading events...</p>
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
            onClick={fetchEvents}
            className="btn-secondary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="section-container">
        <div className="glass-card text-center">
          <div className="mb-4 flex justify-center">
            <div className="icon-bubble">
              <CalendarIcon className="h-8 w-8 text-cyan-300" />
            </div>
          </div>
          <h3 className="heading-3 mb-4">No Events Found</h3>
          <p className="body-section">
            There are no events available at the moment. Check back soon!
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
          </div>
          <div className="glass-card p-4 sm:p-6 mb-6 w-full max-w-7xl mx-auto">
            {(() => {
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              
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
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-xs sm:text-sm font-medium text-white/60 py-1 sm:py-2">
                          {day}
                        </div>
                      ))}
                    </div>
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
                                {sortEventsByTime(day.events).slice(0, 3).map(event => (
                                  <div
                                    key={event.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                      setIsEventModalOpen(true);
                                    }}
                                    className="text-[10px] sm:text-xs px-1 sm:px-2 py-1 sm:py-1.5 cursor-pointer flex flex-col rounded bg-cyan-400/30 text-cyan-200 hover:bg-cyan-400/40"
                                    title={event.name}
                                  >
                                    <div className="font-medium line-clamp-1 sm:line-clamp-2 mb-0.5">
                                      {event.name}
                                    </div>
                                    {event.time && (
                                      <div className="text-[9px] sm:text-[10px] text-cyan-300/80">
                                        {event.time}
                                      </div>
                                    )}
                                  </div>
                                ))}
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
                    <div className="hidden sm:grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-xs sm:text-sm font-medium text-white/60 py-1 sm:py-2">
                          {day}
                        </div>
                      ))}
                    </div>
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
                              {sortEventsByTime(day.events).map(event => (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setIsEventModalOpen(true);
                                  }}
                                  className="text-xs sm:text-sm px-2 sm:px-3 py-2 rounded cursor-pointer flex flex-col bg-cyan-400/30 text-cyan-200 hover:bg-cyan-400/40"
                                  title={event.name}
                                >
                                  <div className="font-medium line-clamp-2 mb-1">
                                    {event.name}
                                  </div>
                                  {event.time && (
                                    <div className="text-[10px] sm:text-xs text-cyan-300/80">
                                      {event.time}
                                    </div>
                                  )}
                                </div>
                              ))}
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
                  {filteredEvents.filter(e => !e.date).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="event-card group relative overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventModalOpen(true);
                      }}
                    >
                      <h3 className="heading-3 mb-4">{event.name}</h3>
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
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="section-container mt-6">
          {/* View toggle buttons */}
          <div className="flex justify-end gap-2 mb-6">
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
          </div>
          <div className="relative">
            {groupEventsByDate(filteredEvents).map((dateGroup, groupIndex) => {
              const timelineDate = dateGroup.dateKey !== 'no-date' 
                ? formatTimelineDate(dateGroup.events[0]?.date) 
                : null;
              
              return (
                <div key={dateGroup.dateKey} className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                  {/* Timeline Left Side - Date */}
                  <div className="flex-shrink-0 w-full sm:w-32 md:w-40">
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
                      {dateGroup.events.map((event, eventIndex) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.4, delay: (groupIndex * 0.1) + (eventIndex * 0.05) }}
                          className="event-card group relative overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEventModalOpen(true);
                          }}
                        >
                          {event.time && (
                            <div className="text-sm text-cyan-300 font-medium mb-2">
                              {event.time}
                            </div>
                          )}

                          <h3 className="heading-3 mb-4">{event.name}</h3>

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
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: eventIndex * 0.2 }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
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
                    </div>

                    {selectedEvent.description && (
                      <div>
                        <p className="label-form text-xs mb-2">Description</p>
                        <p className="body-section whitespace-pre-wrap">{selectedEvent.description}</p>
                      </div>
                    )}

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
      </AnimatePresence>
    </>
  );
};

export default EventsPage;
