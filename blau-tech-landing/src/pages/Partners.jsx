import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  RocketLaunchIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import StaticBackground from '../components/StaticBackground';
import JoinModal from '../components/JoinModal';

const initialGeneralForm = {
  name: '',
  company: '',
  message: '',
};

const initialEventForm = {
  link: '',
};

const Partners = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [generalForm, setGeneralForm] = useState(initialGeneralForm);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [generalSubmitted, setGeneralSubmitted] = useState(false);
  const [eventSubmitted, setEventSubmitted] = useState(false);
  const [generalErrors, setGeneralErrors] = useState({});
  const [eventErrors, setEventErrors] = useState({});
  const [isGeneralSubmitting, setIsGeneralSubmitting] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [generalHasAttemptedSubmit, setGeneralHasAttemptedSubmit] = useState(false);
  const [eventHasAttemptedSubmit, setEventHasAttemptedSubmit] = useState(false);

  const isGeneralFormValid = () => {
    return (
      generalForm.name.trim() !== '' &&
      generalForm.company.trim() !== '' &&
      generalForm.message.trim() !== ''
    );
  };

  const isEventFormValid = () => {
    return eventForm.link.trim() !== '';
  };

  const validateGeneralForm = () => {
    const nextErrors = {};
    if (!generalForm.name.trim()) {
      nextErrors.name = 'Please share your name.';
    }
    if (!generalForm.company.trim()) {
      nextErrors.company = 'Please provide your company.';
    }
    if (!generalForm.message.trim()) {
      nextErrors.message = 'Please provide a message.';
    }
    return nextErrors;
  };

  const validateEventForm = () => {
    const nextErrors = {};
    if (!eventForm.link.trim()) {
      nextErrors.link = 'Please provide a link to the event.';
    } else if (!/^https?:\/\/.+/.test(eventForm.link.trim())) {
      nextErrors.link = 'Please provide a valid URL (starting with http:// or https://).';
    }
    return nextErrors;
  };

  const handleGeneralChange = (field) => (event) => {
    const value = event.target.value;
    setGeneralForm((prev) => ({ ...prev, [field]: value }));
    if (generalErrors[field]) {
      setGeneralErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleEventChange = (field) => (event) => {
    const value = event.target.value;
    setEventForm((prev) => ({ ...prev, [field]: value }));
    if (eventErrors[field]) {
      setEventErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleGeneralSubmit = (event) => {
    event.preventDefault();
    setGeneralHasAttemptedSubmit(true);
    
    // Validate the form
    const formErrors = validateGeneralForm();
    setGeneralErrors(formErrors);

    // Only proceed if there are no errors
    if (Object.keys(formErrors).length === 0) {
      setIsGeneralSubmitting(true);
      
      // Format the email subject
      const subject = encodeURIComponent(`Partnership Inquiry - ${generalForm.company}`);
      
      // Format the email body with professional structure
      const greeting = 'Hello Blau Tech,';
      const messageSection = generalForm.message.trim();
      const signature = `Best regards,\n\n${generalForm.name}\n${generalForm.company}`;
      
      // Create a well-structured, professional email body
      const body = [
        greeting,
        '',
        messageSection,
        '',
        '',
        '---',
        signature
      ].join('\n');
      
      const encodedBody = encodeURIComponent(body);
      
      // Create mailto link
      const emailAddress = 'partner@blau-tech.de'; // Update this with your actual contact email
      const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${encodedBody}`;
      
      // Open the mailto link
      window.location.href = mailtoLink;
      
      // Show success message after a brief delay
      setTimeout(() => {
        setGeneralSubmitted(true);
        setGeneralForm(initialGeneralForm);
        setIsGeneralSubmitting(false);
      }, 100);
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    setEventHasAttemptedSubmit(true);
    
    // Validate the form
    const formErrors = validateEventForm();
    setEventErrors(formErrors);

    // Only proceed if there are no errors
    if (Object.keys(formErrors).length === 0) {
      setIsEventSubmitting(true);
      
      try {
        // Send webhook POST request
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl) {
          console.error('Webhook URL is not set');
          setEventErrors({
            link: 'Something went wrong. Please try again.',
          });
          setIsEventSubmitting(false);
          return;
        }
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_link: eventForm.link.trim() }),
        });
 
        if (!webhookResponse.ok) {
          console.error('Webhook error:', `HTTP error! status: ${webhookResponse.status}`);
          setEventErrors({
            link: 'Something went wrong. Please try again.',
          });
          setIsEventSubmitting(false);
          return;
        }

        // Success - show success message
        setEventSubmitted(true);
        setEventForm(initialEventForm);
        setIsEventSubmitting(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setEventErrors({
          link: 'Something went wrong. Please try again.',
        });
        setIsEventSubmitting(false);
      }
    }
  };

  const resetGeneralForm = () => {
    setGeneralSubmitted(false);
    setGeneralForm(initialGeneralForm);
    setGeneralErrors({});
    setGeneralHasAttemptedSubmit(false);
  };

  const resetEventForm = () => {
    setEventSubmitted(false);
    setEventForm(initialEventForm);
    setEventErrors({});
    setEventHasAttemptedSubmit(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'general') {
      resetGeneralForm();
    } else {
      resetEventForm();
    }
  };

  const benefits = [
    {
      title: 'Recruit Top Talent Early',
      description: 'Get first access to Bavaria\'s brightest tech minds before they hit the job market.',
      icon: SparklesIcon,
    },
    {
      title: 'Amplify Your Brand',
      description: 'Reach 400+ tech enthusiasts and position your company as an innovation leader in Bavaria.',
      icon: RocketLaunchIcon,
    },
    {
      title: 'Exclusive Access & Events',
      description: 'Host workshops, sponsor hackathons, and get priority access to exclusive tech events across Bavaria\'s universities.',
      icon: LightBulbIcon,
    },
  ];

  const stats = [
    { number: '400+', label: 'Community Members' },
    { number: '5+', label: 'Events Annually' },
    { number: '3+', label: 'University Partners' },
    { number: '10+', label: 'Industry Connections' },
  ];

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
          <section className="relative z-10 w-full pt-20 pb-10 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center px-4 sm:px-0"
              >
                <p className="label-section">Partnership Opportunities</p>
                <h1 className="heading-1 mt-4 sm:mt-6">
                  Invest in Bavaria's
                  <br />
                  Tech Future
                </h1>
                <p className="body-hero mt-6 sm:mt-8 max-w-3xl mx-auto">
                  Connect with 400+ tech students and professionals. Build your brand and find top talent.
                </p>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
                className="mt-12 sm:mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8 px-4 sm:px-0"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                    className="glass-surface p-4 sm:p-6 text-center backdrop-blur-md"
                  >
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                      {stat.number}
                    </div>
                    <div className="label-stat">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="relative z-10 w-full py-12 sm:py-16 lg:py-20 bg-white/5">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center mb-8 sm:mb-12"
              >
                <h2 className="heading-2">Why Partner With Us</h2>
                <p className="body-section mt-4 max-w-2xl mx-auto px-4">
                  Unlock exclusive benefits when you partner with Blau Tech.
                </p>
              </motion.div>

              <div className="flex flex-col gap-4 max-w-4xl mx-auto px-4 sm:px-0">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    className="glass-surface p-4 sm:p-5 backdrop-blur-md rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg">
                          <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-300" aria-hidden />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-1.5 sm:mb-2 leading-tight">{benefit.title}</h3>
                        <p className="body-section leading-relaxed text-slate-200/90 max-w-none">{benefit.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Forms Section */}
          <section className="relative z-10 w-full py-8 pb-16 sm:py-12 sm:pb-20 lg:py-16 lg:pb-24">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center mb-6 sm:mb-8 px-4 sm:px-0"
              >
                <h2 className="heading-2">Let's Connect</h2>
                <p className="body-section mt-4 max-w-2xl mx-auto">
                  Reach out to discuss partnership opportunities or promote your event.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card max-w-4xl mx-4 sm:mx-auto p-4 sm:p-6 rounded-lg"
              >
                {/* Professional Tabs with Sharp Corners */}
                <div className="mb-3 flex gap-0">
                  <button
                    type="button"
                    onClick={() => handleTabChange('general')}
                    className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 ${
                      activeTab === 'general'
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <span className="relative inline-block">
                      Partnership Inquiry
                      {activeTab === 'general' && (
                        <motion.span
                          className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white"
                          layoutId="activeTabIndicator"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('event')}
                    className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 ${
                      activeTab === 'event'
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <span className="relative inline-block">
                      Event Promotion
                      {activeTab === 'event' && (
                        <motion.span
                          className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white"
                          layoutId="activeTabIndicator"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  <AnimatePresence mode="wait">
                    {activeTab === 'general' ? (
                      <motion.div
                        key="general"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        {generalSubmitted ? (
                          <motion.div
                            className="flex flex-col gap-4 text-center py-8"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <h3 className="heading-2">Message Sent</h3>
                            <p className="body-section max-w-md mx-auto">
                              Thank you! We'll get back to you within 1-2 business days.
                            </p>
                            <button
                              onClick={resetGeneralForm}
                              className="btn-secondary mt-3 mx-auto"
                            >
                              Send Another Message
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleGeneralSubmit} noValidate className="grid gap-4">
                            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="grid gap-1.5">
                                <label htmlFor="general-name" className="label-form text-white/80">
                                  Name *
                                </label>
                                <input
                                  id="general-name"
                                  type="text"
                                  value={generalForm.name}
                                  onChange={handleGeneralChange('name')}
                                  className="form-field text-xs sm:text-sm lg:text-base rounded-sm"
                                  placeholder="John Doe"
                                  required
                                />
                                {generalErrors.name && <p className="text-[10px] sm:text-xs lg:text-sm text-cyan-300">{generalErrors.name}</p>}
                              </div>

                              <div className="grid gap-1.5">
                                <label htmlFor="general-company" className="label-form text-white/80">
                                  Company *
                                </label>
                                <input
                                  id="general-company"
                                  type="text"
                                  value={generalForm.company}
                                  onChange={handleGeneralChange('company')}
                                  className="form-field text-xs sm:text-sm lg:text-base rounded-sm"
                                  placeholder="Acme Corporation"
                                  required
                                />
                                {generalErrors.company && <p className="text-[10px] sm:text-xs lg:text-sm text-cyan-300">{generalErrors.company}</p>}
                              </div>
                            </div>

                            <div className="grid gap-1.5">
                              <label htmlFor="general-message" className="label-form text-white/80">
                                Message *
                              </label>
                              <textarea
                                id="general-message"
                                value={generalForm.message}
                                onChange={handleGeneralChange('message')}
                                className="form-field min-h-[100px] sm:min-h-[120px] resize-none text-xs sm:text-sm lg:text-base rounded-sm"
                                placeholder="Tell us about your partnership goals..."
                                required
                              />
                              {generalErrors.message && <p className="text-[10px] sm:text-xs lg:text-sm text-cyan-300">{generalErrors.message}</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pt-3">
                              <p className="text-[10px] sm:text-xs lg:text-sm text-white/60">* Required fields</p>
                              <button
                                type="submit"
                                disabled={!isGeneralFormValid() || isGeneralSubmitting}
                                className={`btn-primary w-full sm:w-auto px-6 sm:px-8 py-2 text-xs sm:text-sm lg:text-base ${
                                  !isGeneralFormValid() || isGeneralSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isGeneralSubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="event"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        {eventSubmitted ? (
                          <motion.div
                            className="flex flex-col gap-4 text-center py-8"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <h3 className="heading-2">Event Submitted</h3>
                            <p className="body-section max-w-md mx-auto">
                              Thank you! We'll review your event and reach out within 24 hours.
                            </p>
                            <button
                              onClick={resetEventForm}
                              className="btn-secondary mt-3 mx-auto"
                            >
                              Submit Another Event
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleEventSubmit} noValidate className="grid gap-4">
                            <div className="grid gap-1.5">
                              <label htmlFor="event-link" className="label-form text-white/80">
                                Event Link *
                              </label>
                              <input
                                id="event-link"
                                type="url"
                                value={eventForm.link}
                                onChange={handleEventChange('link')}
                                className="form-field text-xs sm:text-sm lg:text-base rounded-sm"
                                placeholder="https://example.com/event"
                                required
                              />
                              {eventErrors.link && <p className="text-[10px] sm:text-xs lg:text-sm text-cyan-300">{eventErrors.link}</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pt-3">
                              <p className="text-[10px] sm:text-xs lg:text-sm text-white/60">* Required field</p>
                              <button
                                type="submit"
                                disabled={!isEventFormValid() || isEventSubmitting}
                                className={`btn-primary w-full sm:w-auto px-6 sm:px-8 py-2 text-xs sm:text-sm lg:text-base ${
                                  !isEventFormValid() || isEventSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isEventSubmitting ? 'Submitting...' : 'Submit Event'}</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
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

export default Partners;

