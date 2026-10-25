import React from 'react';

interface DeviceFrameProps {
  isDeviceFrame: boolean;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ isDeviceFrame, children }) => {
  if (!isDeviceFrame) {
    return <div className="relative w-full h-screen overflow-hidden bg-[#050608]">{children}</div>;
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Smartphone Outer Chassis */}
      <div className="relative w-full max-w-[430px] h-full sm:h-[880px] sm:max-h-[96vh] rounded-none sm:rounded-[48px] bg-black shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_0_12px_#181a20,0_0_0_14px_#2d3139] border border-white/10 flex flex-col overflow-hidden">
        {/* Top Punch Hole Camera Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-40 w-3.5 h-3.5 rounded-full bg-[#0a0a0c] border border-white/10 shadow-inner pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
        </div>

        {/* Screen Viewport */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Android Gesture Navigation Bar Pill at Bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-35 pointer-events-none">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
