const StaticBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Static gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-0.75" />
      
      {/* Static gradient blobs - same positions and colors as animated version */}
      <div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl"
        style={{ 
          background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.45), rgba(96, 167, 238, 0.65), rgba(153, 202, 250, 0.55), rgba(255, 255, 255, 0.35))',
        }}
      />
      <div
        className="absolute -top-12 right-1/4 h-[32rem] w-[32rem] rounded-full blur-[140px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.4), rgba(153, 202, 250, 0.6), rgba(255, 255, 255, 0.3))',
        }}
      />
      <div
        className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full blur-[130px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.4), rgba(96, 167, 238, 0.3))',
        }}
      />
      <div
        className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full blur-[90px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(96, 167, 238, 0.35), rgba(153, 202, 250, 0.3))',
        }}
      />
      <div
        className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full blur-[100px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.3), rgba(96, 167, 238, 0.25))',
        }}
      />
      <div
        className="absolute top-1/3 right-1/3 h-72 w-72 rounded-full blur-[110px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(96, 167, 238, 0.3), rgba(153, 202, 250, 0.25))',
        }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 h-56 w-56 rounded-full blur-[95px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.35), rgba(96, 167, 238, 0.3))',
        }}
      />
    </div>
  );
};

export default StaticBackground;

