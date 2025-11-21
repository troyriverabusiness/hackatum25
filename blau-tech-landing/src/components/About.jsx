import { motion } from 'framer-motion';
import { SparklesIcon, BoltIcon, UsersIcon } from '@heroicons/react/24/outline';

const highlights = [
  {
    title: 'Events',
    copy: 'Discover local meetups, talks, and tech gatherings across Bavaria, all in one clear view.',
    icon: UsersIcon,
  },
  {
    title: 'Hackathons',
    copy: 'Find upcoming hackathons and build weekends where students turn ideas into real projects.',
    icon: BoltIcon,
  },
  {
    title: 'Scholarships',
    copy: 'Stay informed about scholarship opportunities and programs supporting talent in tech.',
    icon: SparklesIcon,
  },
];


const About = () => {
  return (
    <section id="about" className="relative z-10 w-full section-padding">
      <div className="section-container section-gap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <p className="label-section">About</p>
          <h2 className="heading-2 mt-4 max-w-4xl">
            Blau Tech connects Bavaria&rsquo;s next generation of tech talent with real opportunities.
          </h2>
          <p className="body-section mt-6 max-w-3xl">
            We&rsquo;re building a community where students, junior talent, and early-stage founders in Bavaria can easily discover and connect with the opportunities that matter. Whether it&rsquo;s local events, hackathons, or scholarships, we bring together the people, projects, and possibilities that drive our tech ecosystem forward.
          </p>
        </motion.div>

        <div className="card-grid">
          {highlights.map(({ title, copy, icon: Icon }, index) => (
            <motion.div
              key={title}
              className="glass-card relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.75, delay: index * 0.1, ease: 'easeOut' }}
            >
              <div className="mb-4 flex items-center gap-4">
                <span className="icon-bubble">
                  <Icon className="h-6 w-6 text-cyan-300" aria-hidden />
                </span>
                <h3 className="heading-3">{title}</h3>
              </div>
              <p className="body-subtle text-left">{copy}</p>
              <motion.div
                className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="glass-card flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <div>
            <p className="label-section">Your momentum, amplified</p>
            <h3 className="heading-3 mt-3">
              Connect with students, founders, and builders shaping Bavaria&rsquo;s tech future.
            </h3>
          </div>
          <div className="stats-grid">
            <div className="glass-surface overflow-hidden p-6 text-center">
              <p className="text-4xl font-semibold text-white">3K+</p>
              <p className="label-stat mt-2 break-words">Community reach</p>
            </div>
            <div className="glass-surface overflow-hidden p-6 text-center">
              <p className="text-4xl font-semibold text-white">10+</p>
              <p className="label-stat mt-2 break-words">Partners</p>
            </div>
            <div className="glass-surface overflow-hidden p-6 text-center">
              <p className="text-4xl font-semibold text-white">3+</p>
              <p className="label-stat mt-2 break-words">Upcoming events</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;

