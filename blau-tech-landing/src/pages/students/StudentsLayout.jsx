import { Outlet } from 'react-router-dom';
import StudentsNavbar from '../../components/StudentsNavbar';
import StaticBackground from '../../components/StaticBackground';

const StudentsLayout = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <StaticBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <StudentsNavbar />
        <main className="flex-1">
          {/* Content Area */}
          <section className="relative z-10 w-full pt-24 pb-24 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-32">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentsLayout;

