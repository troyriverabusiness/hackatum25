import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import JoinModal from '../components/JoinModal';
import { supabase } from '../lib/supabase';

const Events = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'event', 'hackathon', 'scholarship'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch from partner_events table
      const { data, error: eventsError } = await supabase
        .from('partner_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Transform the data to a unified format
      const transformedEvents = (data || []).map(event => ({
        id: event.id,
        name: event.name,
        type: 'event', // Default type, could be enhanced based on event data
        date: event.date || null,
        description: event.description || null,
        link: event.link,
        organizer: event.organiser || null,
        location: event.location || null,
        createdAt: event.created_at,
      }));

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => {
        if (filter === 'event') return event.type === 'event' || !event.type;
        if (filter === 'hackathon') return event.type === 'hackathon';
        if (filter === 'scholarship') return event.type === 'scholarship';
        return true;
      });

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar 
          onJoinClick={() => setIsModalOpen(true)} 
          onPartnersClick={() => {}}
        />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative z-10 w-full section-padding">
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

              {/* Filter Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-12 flex flex-wrap justify-center gap-3"
              >
                {[
                  { key: 'all', label: 'All', icon: CalendarIcon },
                  { key: 'event', label: 'Events', icon: CalendarIcon },
                  { key: 'hackathon', label: 'Hackathons', icon: BoltIcon },
                  { key: 'scholarship', label: 'Scholarships', icon: SparklesIcon },
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
              </motion.div>
            </div>
          </section>

          {/* Events Grid */}
          <section className="relative z-10 w-full section-padding">
            <div className="section-container">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
                    <p className="body-subtle">Loading events...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="glass-card text-center">
                  <p className="body-section text-red-400">{error}</p>
                  <button
                    onClick={fetchEvents}
                    className="btn-secondary mt-4"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
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
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="wait">
                    {filteredEvents.map((event, index) => {
                      const Icon = getTypeIcon(event.type);
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -30 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="glass-card group relative overflow-hidden"
                        >
                          {/* Type Badge */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="icon-bubble">
                                <Icon className="h-5 w-5 text-cyan-300" />
                              </span>
                              <span className="label-form text-xs">
                                {getTypeLabel(event.type)}
                              </span>
                            </div>
                          </div>

                          {/* Event Name */}
                          <h3 className="heading-3 mb-3 line-clamp-2">
                            {event.name}
                          </h3>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4">
                            {event.date && (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{formatDate(event.date)}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            )}
                            {event.organizer && (
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="line-clamp-1">{event.organizer}</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="body-subtle mb-4 line-clamp-3">
                              {event.description}
                            </p>
                          )}

                          {/* Link Button */}
                          {event.link && (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2"
                            >
                              <span>Learn More</span>
                              <LinkIcon className="h-4 w-4" />
                            </a>
                          )}

                          {/* Hover Effect */}
                          <motion.div
                            className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
      <AnimatePresence mode="wait">
        {isModalOpen && <JoinModal key="join-modal" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Events;




