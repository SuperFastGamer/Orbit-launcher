import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';
import { haptics } from '../../utils/audio';

interface SecurityPinModalProps {
  correctPin: string;
  onSuccess: () => void;
  onDismiss: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  correctPin,
  onSuccess,
  onDismiss,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      haptics.playTick();
      const next = enteredPin + digit;
      setEnteredPin(next);

      if (next.length === 4) {
        if (next === correctPin) {
          haptics.playSnap();
          onSuccess();
        } else {
          haptics.playEmergencyAlert();
          setErrorShake(true);
          setTimeout(() => {
            setEnteredPin('');
            setErrorShake(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    haptics.playTick();
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xs bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl text-center transition-all ${
          errorShake ? 'animate-bounce border-red-500' : ''
        }`}
      >
        <div className="flex justify-between items-center pb-2">
          <div className="w-8" />
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-white mt-2">Enter Security PIN</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Required to access settings</p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < enteredPin.length
                  ? 'bg-blue-500 scale-125'
                  : 'bg-slate-700 border border-white/20'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 text-white font-mono text-base font-medium flex items-center justify-center cursor-pointer transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setEnteredPin('')}
            className="h-12 rounded-xl bg-slate-800/40 text-slate-400 text-xs font-mono flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 text-white font-mono text-base font-medium flex items-center justify-center cursor-pointer transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
