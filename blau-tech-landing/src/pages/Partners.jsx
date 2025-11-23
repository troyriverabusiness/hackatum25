import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  UserGroupIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  LightBulbIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import StaticBackground from '../components/StaticBackground';
import JoinModal from '../components/JoinModal';

const initialGeneralForm = {
  name: '',
  company: '',
  contactType: '',
  message: '',
};

const initialEventForm = {
  name: '',
  link: '',
};

const Partners = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [generalForm, setGeneralForm] = useState(initialGeneralForm);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isGeneralFormValid = () => {
    return (
      generalForm.name.trim() !== '' &&
      generalForm.company.trim() !== '' &&
      generalForm.contactType !== '' &&
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
    if (!generalForm.contactType || generalForm.contactType === '') {
      nextErrors.contactType = 'Please select a contact type.';
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
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleEventChange = (field) => (event) => {
    const value = event.target.value;
    setEventForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleGeneralSubmit = (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    
    // Validate the form
    const formErrors = validateGeneralForm();
    setErrors(formErrors);

    // Only proceed if there are no errors
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      // Format the email subject: "contactType - Company"
      const subject = encodeURIComponent(`${generalForm.contactType} - ${generalForm.company}`);
      
      // Format the email body with professional structure
      const greeting = 'Hello Blau Tech,';
      const introSentence = `I am writing to inquire about ${generalForm.contactType.toLowerCase()} opportunities with Blau Tech.`;
      const messageSection = generalForm.message.trim();
      const signature = `Best regards,\n\n${generalForm.name}\n${generalForm.company}`;
      
      // Create a well-structured, professional email body
      const body = [
        greeting,
        '',
        introSentence,
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
        setSubmitted(true);
        setGeneralForm(initialGeneralForm);
        setIsSubmitting(false);
      }, 100);
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    
    // Validate the form
    const formErrors = validateEventForm();
    setErrors(formErrors);

    // Only proceed if there are no errors
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        // Send webhook POST request
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl) {
          console.error('Webhook URL is not set');
          setErrors({
            link: 'Something went wrong. Please try again.',
          });
          setIsSubmitting(false);
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
          setErrors({
            link: 'Something went wrong. Please try again.',
          });
          setIsSubmitting(false);
          return;
        }

        // Success - show success message
        setSubmitted(true);
        setEventForm(initialEventForm);
        setIsSubmitting(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setErrors({
          link: 'Something went wrong. Please try again.',
        });
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setGeneralForm(initialGeneralForm);
    setEventForm(initialEventForm);
    setErrors({});
    setHasAttemptedSubmit(false);
  };

  const benefits = [
    {
      title: 'Access to Talent',
      description: 'Connect with Bavaria\'s brightest tech students and professionals.',
      icon: SparklesIcon,
    },
    {
      title: 'Brand Visibility',
      description: 'Showcase your brand to a highly engaged tech audience.',
      icon: RocketLaunchIcon,
    },
    {
      title: 'Community Impact',
      description: 'Support the next generation of tech innovators.',
      icon: TrophyIcon,
    },
    {
      title: 'Recruitment Pipeline',
      description: 'Build relationships with top talent early.',
      icon: ChartBarIcon,
    },
    {
      title: 'Innovation Network',
      description: 'Join Bavaria\'s vibrant tech ecosystem.',
      icon: LightBulbIcon,
    },
    {
      title: 'Event Opportunities',
      description: 'Host workshops and talks with our community.',
      icon: GlobeAltIcon,
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
          <section className="relative z-10 w-full pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center"
              >
                <p className="label-section">Partnership Opportunities</p>
                <h1 className="heading-1 mt-6">
                  Invest in Bavaria's
                  <br />
                  Tech Future
                </h1>
                <p className="body-hero mt-8 max-w-3xl mx-auto">
                  Connect with 400+ tech students and professionals. Build your brand and find top talent.
                </p>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
                className="mt-16 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                    className="glass-surface p-6 text-center backdrop-blur-md"
                  >
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
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
                className="text-center mb-12"
              >
                <h2 className="heading-2">Why Partner With Us</h2>
                <p className="body-section mt-4 max-w-2xl mx-auto">
                  Unlock exclusive benefits when you partner with Blau Tech.
                </p>
              </motion.div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    className="glass-surface p-6 backdrop-blur-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                  >
                    <benefit.icon className="h-8 w-8 text-cyan-300 mb-4" aria-hidden />
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="body-subtle">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Forms Section */}
          <section className="relative z-10 w-full py-12 pb-24 sm:py-16 sm:pb-28 lg:py-20 lg:pb-32">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center mb-12"
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
                className="glass-card max-w-4xl mx-auto"
              >
                {/* Tabs */}
                <div className="mb-10 flex gap-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('general');
                      resetForm();
                    }}
                    className={`relative px-8 py-4 text-base font-medium ${
                      activeTab === 'general'
                        ? 'text-white'
                        : 'text-white/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5" />
                      Partnership Inquiry
                    </span>
                    {activeTab === 'general' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                        layoutId="activeTab"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('event');
                      resetForm();
                    }}
                    className={`relative px-8 py-4 text-base font-medium ${
                      activeTab === 'event'
                        ? 'text-white'
                        : 'text-white/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Event Promotion
                    </span>
                    {activeTab === 'event' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                        layoutId="activeTab"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    {activeTab === 'general' ? (
                      <motion.div
                        key="general"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {submitted ? (
                          <motion.div
                            className="flex flex-col gap-6 text-center py-12"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <div className="mb-4 flex justify-center">
                              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-400/30">
                                <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="heading-2">Message Sent!</h3>
                            <p className="body-section max-w-md mx-auto">
                              Thank you! We'll get back to you within 1-2 business days.
                            </p>
                            <button
                              onClick={resetForm}
                              className="btn-secondary mt-4 mx-auto"
                            >
                              Send Another Message
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleGeneralSubmit} noValidate className="grid gap-8">
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="grid gap-3">
                                <label htmlFor="general-name" className="label-form text-white/80">
                                  Your Name *
                                </label>
                                <input
                                  id="general-name"
                                  type="text"
                                  value={generalForm.name}
                                  onChange={handleGeneralChange('name')}
                                  className="form-field text-base"
                                  placeholder="John Doe"
                                  required
                                />
                                {errors.name && <p className="text-sm text-cyan-300">{errors.name}</p>}
                              </div>

                              <div className="grid gap-3">
                                <label htmlFor="general-company" className="label-form text-white/80">
                                  Company Name *
                                </label>
                                <input
                                  id="general-company"
                                  type="text"
                                  value={generalForm.company}
                                  onChange={handleGeneralChange('company')}
                                  className="form-field text-base"
                                  placeholder="Acme Corporation"
                                  required
                                />
                                {errors.company && <p className="text-sm text-cyan-300">{errors.company}</p>}
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <label htmlFor="general-contact-type" className="label-form text-white/80">
                                Partnership Type *
                              </label>
                              <select
                                id="general-contact-type"
                                value={generalForm.contactType}
                                onChange={handleGeneralChange('contactType')}
                                className="form-field text-base"
                                required
                              >
                                <option value="">Select partnership type</option>
                                <option value="Strategic Partnership">Strategic Partnership</option>
                                <option value="Event Sponsorship">Event Sponsorship</option>
                                <option value="Collaboration">Collaboration</option>
                                <option value="Other">Other</option>
                              </select>
                              {errors.contactType && <p className="text-sm text-cyan-300">{errors.contactType}</p>}
                            </div>

                            <div className="grid gap-3">
                              <label htmlFor="general-message" className="label-form text-white/80">
                                Your Message *
                              </label>
                              <textarea
                                id="general-message"
                                value={generalForm.message}
                                onChange={handleGeneralChange('message')}
                                className="form-field min-h-[160px] resize-none text-base"
                                placeholder="Tell us about your partnership goals..."
                                required
                              />
                              {errors.message && <p className="text-sm text-cyan-300">{errors.message}</p>}
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                              <p className="text-sm text-white/60">* Required fields</p>
                              <button
                                type="submit"
                                disabled={!isGeneralFormValid() || isSubmitting}
                                className={`btn-primary px-10 ${
                                  !isGeneralFormValid() || isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isSubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="event"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {submitted ? (
                          <motion.div
                            className="flex flex-col gap-6 text-center py-12"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <div className="mb-4 flex justify-center">
                              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-400/30">
                                <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="heading-2">Event Submitted!</h3>
                            <p className="body-section max-w-md mx-auto">
                              Thank you! We'll review your event and reach out within 24 hours.
                            </p>
                            <button
                              onClick={resetForm}
                              className="btn-secondary mt-4 mx-auto"
                            >
                              Submit Another Event
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleEventSubmit} noValidate className="grid gap-8">
                            <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-400/20">
                                  <CalendarIcon className="h-6 w-6 text-cyan-300" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-2">Event Promotion</h3>
                                  <p className="body-subtle">
                                    Submit your event link. We'll promote it to 400+ tech enthusiasts through our channels.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3">
                              <label htmlFor="event-link" className="label-form text-white/80">
                                Event Link (LinkedIn, Lu.ma, Eventbrite, etc.) *
                              </label>
                              <input
                                id="event-link"
                                type="url"
                                value={eventForm.link}
                                onChange={handleEventChange('link')}
                                className="form-field text-base rounded-2xl"
                                placeholder="https://lu.ma/your-event"
                                required
                              />
                              {errors.link && <p className="text-sm text-cyan-300">{errors.link}</p>}
                              <p className="text-sm text-white/50 mt-1">
                                Provide a direct link to your event page.
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                              <p className="text-sm text-white/60">* Required field</p>
                              <button
                                type="submit"
                                disabled={!isEventFormValid() || isSubmitting}
                                className={`btn-primary px-10 ${
                                  !isEventFormValid() || isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Event'}</span>
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

