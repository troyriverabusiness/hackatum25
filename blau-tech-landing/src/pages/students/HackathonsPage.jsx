import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const HackathonsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="section-container">
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

