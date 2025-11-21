import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const ScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchScholarships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch scholarships by filtering name for 'scholarship' or 'stipend'
      // Note: If you add a 'type' column to the events table in the future,
      // you can update this query to use: .eq('type', 'scholarship')
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .or('name.ilike.%scholarship%,name.ilike.%stipend%,description.ilike.%scholarship%,description.ilike.%stipend%')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;

      const transformedScholarships = (data || []).map(scholarship => ({
        id: scholarship.id,
        name: scholarship.name,
        type: 'scholarship',
        date: scholarship.start_date || null,
        time: scholarship.start_time || null,
        description: scholarship.description || null,
        link: scholarship.link || null,
        organizer: scholarship.organisers || null,
        location: scholarship.location || null,
        format: scholarship.format || null,
        isHighlight: scholarship.is_highlight || false,
        createdAt: scholarship.created_at,
      }));

      setScholarships(transformedScholarships);
    } catch (err) {
      console.error('Error fetching scholarships:', err);
      setError('Failed to load scholarships. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScholarships();

    // Set up real-time subscription
    const channel = supabase
      .channel('scholarships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchScholarships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScholarships]);

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
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
            <p className="body-subtle">Loading scholarships...</p>
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
            onClick={fetchScholarships}
            className="btn-secondary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (scholarships.length === 0) {
    return (
      <div className="section-container">
        <div className="glass-card text-center">
          <div className="mb-4 flex justify-center">
            <div className="icon-bubble">
              <BanknotesIcon className="h-8 w-8 text-yellow-300" />
            </div>
          </div>
          <h3 className="heading-3 mb-4">No Scholarships Found</h3>
          <p className="body-section">
            There are no scholarships available at the moment. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section-container">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((scholarship, index) => (
            <motion.div
              key={scholarship.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card group relative overflow-hidden cursor-pointer border-yellow-400/20 hover:border-yellow-400/40"
              onClick={() => {
                setSelectedScholarship(scholarship);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="icon-bubble bg-yellow-500/20 border-yellow-400/30">
                  <SparklesIcon className="h-6 w-6 text-yellow-300" />
                </div>
                <h3 className="heading-3 flex-1">{scholarship.name}</h3>
              </div>
              
              <div className="space-y-2">
                {scholarship.date && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span>Deadline: {formatDate(scholarship.date)}</span>
                  </div>
                )}
                {scholarship.location && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{scholarship.location}</span>
                  </div>
                )}
                {scholarship.organizer && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                    <span>By {scholarship.organizer}</span>
                  </div>
                )}
                {scholarship.description && (
                  <p className="text-sm text-white/60 line-clamp-2 mt-3">
                    {scholarship.description}
                  </p>
                )}
              </div>

              <motion.div
                className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-yellow-400/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scholarship Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedScholarship && (
          <Dialog 
            open={isModalOpen} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedScholarship(null);
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
                setSelectedScholarship(null);
              }}
            />

            <div className="fixed inset-0 overflow-y-auto" onClick={() => {
              setIsModalOpen(false);
              setSelectedScholarship(null);
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
                        setSelectedScholarship(null);
                      }}
                      aria-label="Close"
                      className="absolute top-0 right-0 z-10 h-8 w-8 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-start gap-3 pr-12 mb-6">
                      <div className="icon-bubble bg-yellow-500/20 border-yellow-400/30">
                        <SparklesIcon className="h-6 w-6 text-yellow-300" />
                      </div>
                      <Dialog.Title className="heading-3 flex-1">
                        {selectedScholarship.name}
                      </Dialog.Title>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      {selectedScholarship.date && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Application Deadline</p>
                            <p className="body-section">
                              {formatDate(selectedScholarship.date)}
                              {selectedScholarship.time && ` at ${selectedScholarship.time}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.location && (
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Location</p>
                            <p className="body-section">{selectedScholarship.location}</p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.organizer && (
                        <div className="flex items-start gap-3">
                          <UserGroupIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Provided By</p>
                            <p className="body-section">{selectedScholarship.organizer}</p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.format && (
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Format</p>
                            <p className="body-section">{selectedScholarship.format}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedScholarship.description && (
                      <div>
                        <p className="label-form text-xs mb-2">Description</p>
                        <p className="body-section whitespace-pre-wrap">{selectedScholarship.description}</p>
                      </div>
                    )}

                    {selectedScholarship.link && (
                      <div className="pt-4 border-t border-white/10">
                        <a
                          href={selectedScholarship.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <span>View Scholarship Details</span>
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

export default ScholarshipsPage;

