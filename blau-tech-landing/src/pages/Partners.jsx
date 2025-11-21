import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingOfficeIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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

  const partnershipTypes = [
    {
      title: 'Partnership',
      description: 'Build strategic partnerships to grow together in Bavaria\'s tech ecosystem.',
      icon: UserGroupIcon,
    },
    {
      title: 'Sponsorship',
      description: 'Support our community events and hackathons while gaining visibility.',
      icon: BuildingOfficeIcon,
    },
    {
      title: 'Event Promotion',
      description: 'Promote your events to our community of 3K+ tech enthusiasts.',
      icon: CalendarIcon,
    },
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
          <section className="relative z-10 w-full pt-24 pb-6 sm:pt-28 sm:pb-8 lg:pt-32 lg:pb-10">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center"
              >
                <p className="label-section">Partners</p>
                <h1 className="heading-1 mt-4">
                  Partner with Blau Tech
                </h1>
                <p className="body-hero mt-6">
                  Join us in connecting Bavaria's next generation of tech talent with opportunities. Together, we can build a stronger tech ecosystem.
                </p>
              </motion.div>

              {/* Partnership Types Grid */}
              <div className="card-grid mt-16">
                {partnershipTypes.map(({ title, description, icon: Icon }, index) => (
                  <motion.div
                    key={title}
                    className="glass-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, delay: index * 0.1, ease: 'easeOut' }}
                  >
                    <div className="mb-4 flex items-center gap-4">
                      <span className="icon-bubble">
                        <Icon className="h-6 w-6 text-cyan-300" aria-hidden />
                      </span>
                      <h3 className="heading-3">{title}</h3>
                    </div>
                    <p className="body-subtle text-left">{description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Forms Section */}
          <section className="relative z-10 w-full pt-6 pb-24 sm:pt-8 sm:pb-28 lg:pt-10 lg:pb-32">
            <div className="section-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
              >
                <h2 className="heading-3 mb-8">
                  Get in Touch
                </h2>

                {/* Tabs */}
                <div className="mb-8 flex gap-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('general');
                      resetForm();
                    }}
                    className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'general'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    General Contact
                    {activeTab === 'general' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
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
                    className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'event'
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Promote Your Event
                    {activeTab === 'event' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                        layoutId="activeTab"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div>
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
                            className="flex flex-col gap-6 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <div className="mb-4 flex justify-center">
                              <div className="icon-bubble bg-green-500/20">
                                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="heading-3">Thank You!</h3>
                            <p className="body-section">
                              Thank you for reaching out! We&rsquo;ll get back to you soon.
                            </p>
                            <button
                              onClick={resetForm}
                              className="btn-secondary mt-4"
                            >
                              Send Another Message
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleGeneralSubmit} noValidate className="grid gap-6">
                            <div className="grid gap-2 text-sm">
                              <label htmlFor="general-name" className="label-form">
                                Name
                              </label>
                              <input
                                id="general-name"
                                type="text"
                                value={generalForm.name}
                                onChange={handleGeneralChange('name')}
                                className="form-field"
                                placeholder="Your name"
                                required
                              />
                              {errors.name && <p className="body-subtle !text-sky-300">{errors.name}</p>}
                            </div>

                            <div className="grid gap-2 text-sm">
                              <label htmlFor="general-company" className="label-form">
                                Company 
                              </label>
                              <input
                                id="general-company"
                                type="text"
                                value={generalForm.company}
                                onChange={handleGeneralChange('company')}
                                className="form-field"
                                placeholder="Your company"
                                required
                              />
                              {errors.company && <p className="body-subtle !text-sky-300">{errors.company}</p>}
                            </div>

                            <div className="grid gap-2 text-sm">
                              <label htmlFor="general-contact-type" className="label-form">
                                Contact Type
                              </label>
                              <select
                                id="general-contact-type"
                                value={generalForm.contactType}
                                onChange={handleGeneralChange('contactType')}
                                className="form-field"
                                required
                              >
                                <option value="">Select an option</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Sponsorship">Sponsorship</option>
                                <option value="Collaboration">Collaboration</option>
                              </select>
                              {errors.contactType && <p className="body-subtle !text-sky-300">{errors.contactType}</p>}
                            </div>

                            <div className="grid gap-2 text-sm">
                              <label htmlFor="general-message" className="label-form">
                                Message
                              </label>
                              <textarea
                                id="general-message"
                                value={generalForm.message}
                                onChange={handleGeneralChange('message')}
                                className="form-field min-h-[120px] resize-none"
                                placeholder="Tell us how we can help..."
                                required
                              />
                              {errors.message && <p className="body-subtle !text-sky-300">{errors.message}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-2">
                              <motion.button
                                type="submit"
                                disabled={!isGeneralFormValid() || isSubmitting}
                                whileHover={isGeneralFormValid() && !isSubmitting ? { scale: 1.05, y: -2 } : {}}
                                whileTap={isGeneralFormValid() && !isSubmitting ? { scale: 0.97 } : {}}
                                className={`btn-primary ${
                                  !isGeneralFormValid() || isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isSubmitting ? 'Submitting...' : 'Send Message'}</span>
                              </motion.button>
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
                            className="flex flex-col gap-6 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <div className="mb-4 flex justify-center">
                              <div className="icon-bubble bg-green-500/20">
                                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="heading-3">Thank You!</h3>
                            <p className="body-section">
                              Thank you for your event submission! We&rsquo;ll review it and get back to you soon.
                            </p>
                            <button
                              onClick={resetForm}
                              className="btn-secondary mt-4"
                            >
                              Submit Another Event
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleEventSubmit} noValidate className="grid gap-6">
                            <div className="flex items-end gap-4">
                              <div className="flex-1 grid gap-2 text-sm">
                                <label htmlFor="event-link" className="label-form">
                                  Event Link
                                </label>
                                <input
                                  id="event-link"
                                  type="url"
                                  value={eventForm.link}
                                  onChange={handleEventChange('link')}
                                  className="form-field rounded-2xl"
                                  placeholder="https://example.com/event"
                                  required
                                />
                                {errors.link && <p className="body-subtle !text-sky-300">{errors.link}</p>}
                              </div>
                              <motion.button
                                type="submit"
                                disabled={!isEventFormValid() || isSubmitting}
                                whileHover={isEventFormValid() && !isSubmitting ? { scale: 1.05, y: -2 } : {}}
                                whileTap={isEventFormValid() && !isSubmitting ? { scale: 0.97 } : {}}
                                className={`btn-primary !rounded-2xl ${
                                  !isEventFormValid() || isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              >
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Event'}</span>
                              </motion.button>
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

