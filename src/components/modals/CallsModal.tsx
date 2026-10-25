import React, { useState } from 'react';
import { Phone, Users, PhoneCall, Delete, ShieldAlert, X, User } from 'lucide-react';
import { haptics } from '../../utils/audio';

interface CallsModalProps {
  initialTab: 'dialer' | 'contacts';
  emergencyContacts: { name: string; number: string; relation: string }[];
  onDismiss: () => void;
}

const DIALER_KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

export const CallsModal: React.FC<CallsModalProps> = ({
  initialTab,
  emergencyContacts,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'dialer' | 'contacts'>(initialTab);
  const [dialedNumber, setDialedNumber] = useState('');
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const handleKeyPress = (digit: string) => {
    haptics.playTick(440 + parseInt(digit || '5', 10) * 40, 0.04, 0.12);
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    haptics.playTick(350, 0.02, 0.08);
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const initiateCall = (numberToCall: string, name = 'Calling') => {
    haptics.playBloom();
    setCallStatus(`${name} · ${numberToCall}`);
    setTimeout(() => {
      setCallStatus(null);
      onDismiss();
    }, 2500);
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-200"
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dialer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'dialer'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Dialer</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contacts</span>
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Call In-Progress Banner */}
        {callStatus && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-center text-xs animate-pulse font-mono">
            Connecting: {callStatus}...
          </div>
        )}

        {/* DIALER VIEW */}
        {activeTab === 'dialer' && (
          <div className="py-4">
            {/* Number Display */}
            <div className="h-14 flex items-center justify-center relative px-4">
              <span className="text-2xl font-mono text-white tracking-wider truncate">
                {dialedNumber || <span className="text-slate-600 text-lg">Enter number</span>}
              </span>
              {dialedNumber && (
                <button
                  onClick={handleBackspace}
                  className="absolute right-2 p-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 my-2">
              {DIALER_KEYS.map((k) => (
                <button
                  key={k.digit}
                  onClick={() => handleKeyPress(k.digit)}
                  className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600/30 active:scale-95 flex flex-col items-center justify-center transition-all cursor-pointer border border-white/5"
                >
                  <span className="text-xl font-medium text-white">{k.digit}</span>
                  {k.sub && <span className="text-[9px] font-mono text-slate-400 tracking-widest">{k.sub}</span>}
                </button>
              ))}
            </div>

            {/* Bottom Actions: 911 Quick Call & Primary Call button */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => initiateCall('911', 'EMERGENCY DISPATCH (911)')}
                className="px-4 py-3 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="Immediate 911 Emergency Dial"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>911 SOS</span>
              </button>

              <button
                onClick={() => {
                  if (dialedNumber) initiateCall(dialedNumber);
                }}
                disabled={!dialedNumber}
                className="w-16 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-emerald-950 cursor-pointer active:scale-95 transition-all"
              >
                <PhoneCall className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* CONTACTS VIEW */}
        {activeTab === 'contacts' && (
          <div className="py-4">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Designated Emergency & Primary Contacts
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto divide-y divide-white/5">
              {emergencyContacts.map((c, i) => (
                <div
                  key={i}
                  className="pt-2 flex items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs font-mono text-slate-400">
                        {c.relation} · {c.number}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => initiateCall(c.number, c.name)}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info: Never blocked reminder */}
        <div className="pt-3 border-t border-white/10 text-center text-[10px] text-emerald-400 font-mono">
          ✓ Calls & Dialer are permanently unrestricted in all modes
        </div>
      </div>
    </div>
  );
};
