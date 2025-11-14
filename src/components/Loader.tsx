'use client';
import Lottie from 'lottie-react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
      <Lottie
        animationData="/assets/animateLoader.json"
        loop
        autoplay
        style={{ height: 150, width: 150 }}
      />
    </div>
  );
};

export default Loader;
