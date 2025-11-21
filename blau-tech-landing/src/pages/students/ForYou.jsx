import { motion } from 'framer-motion';
import { ClockIcon, CalendarIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ForYou = () => {
  // This is a placeholder timeline for now
  const timelineItems = [
    {
      id: 1,
      type: 'event',
      title: 'Tech Networking Event',
      description: 'Connect with industry professionals',
      date: 'Tomorrow, 6:00 PM',
      category: 'Networking'
    },
    {
      id: 2,
      type: 'hackathon',
      title: 'HackaTUM 2025',
      description: 'Build innovative solutions in 48 hours',
      date: 'Nov 29-30, 2025',
      category: 'Competition'
    },
    {
      id: 3,
      type: 'scholarship',
      title: 'DAAD Scholarship',
      description: 'Funding opportunity for international students',
      date: 'Deadline: Dec 15, 2025',
      category: 'Funding'
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'event':
        return CalendarIcon;
      case 'hackathon':
        return BoltIcon;
      case 'scholarship':
        return SparklesIcon;
      default:
        return ClockIcon;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'event':
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30';
      case 'hackathon':
        return 'from-purple-500/20 to-pink-500/20 border-purple-400/30';
      case 'scholarship':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-400/30';
    }
  };

  return (
    <div className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="heading-2 mb-2">Your Personalized Feed</h2>
          <p className="body-section text-white/70">
            Stay updated with opportunities tailored for you
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {timelineItems.map((item, index) => {
            const Icon = getIcon(item.type);
            const colorClass = getTypeColor(item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`glass-card group relative overflow-hidden cursor-pointer hover:border-opacity-50 transition-all duration-300`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10 flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="icon-bubble bg-white/10 border border-white/20">
                      <Icon className="h-6 w-6 text-cyan-300" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-white/80 mb-2">
                          {item.category}
                        </span>
                        <h3 className="heading-3 text-lg mb-1">{item.title}</h3>
                      </div>
                    </div>
                    <p className="body-section text-white/70 mb-3">{item.description}</p>
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <ClockIcon className="h-4 w-4" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State Message */}
        {timelineItems.length === 0 && (
          <div className="glass-card text-center py-16">
            <div className="icon-bubble mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-cyan-300" />
            </div>
            <h3 className="heading-3 mb-2">Nothing to show yet</h3>
            <p className="body-section text-white/70">
              Check out the other tabs to discover events, hackathons, and scholarships!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForYou;

