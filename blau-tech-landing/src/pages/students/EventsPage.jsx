import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

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
      <div className="section-container">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="event-card group relative overflow-hidden cursor-pointer"
              onClick={() => {
                setSelectedEvent(event);
                setIsEventModalOpen(true);
              }}
            >
              <h3 className="heading-3 mb-4">{event.name}</h3>
              
              <div className="space-y-2">
                {event.date && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <ClockIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                    <span>By {event.organizer}</span>
                  </div>
                )}
              </div>

              <motion.div
                className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

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

