import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { CalendarIcon, MapPinIcon, ClockIcon, LinkIcon, UserGroupIcon, SparklesIcon, XMarkIcon, BanknotesIcon, AcademicCapIcon, BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const ScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [allScholarships, setAllScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScholarships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from scholarships table
      const { data, error: fetchError } = await supabase
        .from('scholarships')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      console.log('Raw scholarships data:', data);
      console.log('Number of scholarships:', data?.length || 0);

      // Helper function to parse arrays (they might be JSON strings or already arrays)
      const parseArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const transformedScholarships = (data || []).map(scholarship => {
        console.log('Processing scholarship:', scholarship);
        return {
        id: scholarship.id,
          title: scholarship.title,
          provider: scholarship.provider,
          shortDescription: scholarship.short_description,
          url: scholarship.url,
          deadline: scholarship.deadline,
          studyLevel: parseArray(scholarship.study_level),
          fieldsOfStudy: parseArray(scholarship.fields_of_study),
        isHighlight: scholarship.is_highlight || false,
        createdAt: scholarship.created_at,
          updatedAt: scholarship.updated_at,
        };
      });

      console.log('Transformed scholarships:', transformedScholarships);
      setAllScholarships(transformedScholarships);
      setScholarships(transformedScholarships);
    } catch (err) {
      console.error('Error fetching scholarships:', err);
      setError(`Failed to load scholarships: ${err.message || 'Unknown error'}`);
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
          table: 'scholarships',
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

  // Filter scholarships based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setScholarships(allScholarships);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allScholarships.filter(scholarship => {
      const title = (scholarship.title || '').toLowerCase();
      const provider = (scholarship.provider || '').toLowerCase();
      const description = (scholarship.shortDescription || '').toLowerCase();
      const studyLevel = (scholarship.studyLevel || []).join(' ').toLowerCase();
      const fieldsOfStudy = (scholarship.fieldsOfStudy || []).join(' ').toLowerCase();

      return (
        title.includes(query) ||
        provider.includes(query) ||
        description.includes(query) ||
        studyLevel.includes(query) ||
        fieldsOfStudy.includes(query)
      );
    });

    setScholarships(filtered);
  }, [searchQuery, allScholarships]);

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
          <h3 className="heading-3 mb-4 text-red-400">Error Loading Scholarships</h3>
          <p className="body-section text-red-400 mb-4">{error}</p>
          <p className="body-subtle text-white/60 mb-4">
            Please check the browser console for more details.
          </p>
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
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white/50" />
            <input
              type="text"
              placeholder="Search scholarships by title, provider, description, study level, or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
            />
          </div>
        </div>

        <div className="glass-card text-center">
          <div className="mb-4 flex justify-center">
            <div className="icon-bubble">
              <BanknotesIcon className="h-8 w-8 text-yellow-300" />
            </div>
          </div>
          <h3 className="heading-3 mb-4">
            {searchQuery ? 'No Scholarships Found' : 'No Scholarships Available'}
          </h3>
          <p className="body-section">
            {searchQuery 
              ? `No scholarships match your search "${searchQuery}". Try a different search term.`
              : 'There are no scholarships available at the moment. Check back soon!'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section-container">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white/50" />
            <input
              type="text"
              placeholder="Search scholarships by title, provider, description, study level, or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-white/60">
              Found {scholarships.length} scholarship{scholarships.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {scholarships.map((scholarship, index) => (
            <motion.div
              key={scholarship.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card group relative overflow-hidden cursor-pointer border-yellow-400/20 hover:border-yellow-400/40 p-8"
              onClick={() => {
                setSelectedScholarship(scholarship);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="icon-bubble bg-yellow-500/20 border-yellow-400/30 flex-shrink-0">
                  <SparklesIcon className="h-8 w-8 text-yellow-300" />
                </div>
                <h3 className="heading-2 flex-1">{scholarship.title}</h3>
              </div>
              
              <div className="space-y-3">
                {scholarship.deadline && (
                  <div className="flex items-center gap-3 text-base text-white/80">
                    <CalendarIcon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                    <span className="font-medium">Deadline: {formatDate(scholarship.deadline)}</span>
                  </div>
                )}
                {scholarship.provider && (
                  <div className="flex items-center gap-3 text-base text-white/80">
                    <UserGroupIcon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                    <span className="font-medium">By {scholarship.provider}</span>
                  </div>
                )}
                {scholarship.studyLevel && scholarship.studyLevel.length > 0 && (
                  <div className="flex items-center gap-3 text-base text-white/80">
                    <AcademicCapIcon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                    <span className="font-medium">{scholarship.studyLevel.join(', ')}</span>
                  </div>
                )}
                {scholarship.fieldsOfStudy && scholarship.fieldsOfStudy.length > 0 && (
                  <div className="flex items-center gap-3 text-base text-white/80">
                    <BookOpenIcon className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                    <span className="font-medium">{scholarship.fieldsOfStudy.join(', ')}</span>
                  </div>
                )}
                {scholarship.shortDescription && (
                  <p className="text-base text-white/70 line-clamp-3 mt-4 leading-relaxed">
                    {scholarship.shortDescription}
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
                        {selectedScholarship.title}
                      </Dialog.Title>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      {selectedScholarship.deadline && (
                        <div className="flex items-start gap-3">
                          <ClockIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Application Deadline</p>
                            <p className="body-section">
                              {formatDate(selectedScholarship.deadline)}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.provider && (
                        <div className="flex items-start gap-3">
                          <UserGroupIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Provided By</p>
                            <p className="body-section">{selectedScholarship.provider}</p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.studyLevel && selectedScholarship.studyLevel.length > 0 && (
                        <div className="flex items-start gap-3">
                          <AcademicCapIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Study Level</p>
                            <p className="body-section">{selectedScholarship.studyLevel.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {selectedScholarship.fieldsOfStudy && selectedScholarship.fieldsOfStudy.length > 0 && (
                        <div className="flex items-start gap-3">
                          <BookOpenIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="label-form text-xs mb-1">Fields of Study</p>
                            <p className="body-section">{selectedScholarship.fieldsOfStudy.join(', ')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedScholarship.shortDescription && (
                      <div>
                        <p className="label-form text-xs mb-2">Description</p>
                        <p className="body-section whitespace-pre-wrap">{selectedScholarship.shortDescription}</p>
                      </div>
                    )}

                    {selectedScholarship.url && (
                      <div className="pt-4 border-t border-white/10">
                        <a
                          href={selectedScholarship.url}
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

