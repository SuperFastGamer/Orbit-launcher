import { AppCategory, AppItem } from '../types/launcher';

export const APP_CATEGORIES: AppCategory[] = [
  { id: 'social', name: 'Social', icon: 'MessageCircle', description: 'Messaging & social platforms' },
  { id: 'media', name: 'Media', icon: 'Play', description: 'Music, video & photography' },
  { id: 'work', name: 'Work & Tools', icon: 'Briefcase', description: 'Productivity & utilities' },
  { id: 'finance', name: 'Finance', icon: 'CreditCard', description: 'Banking, crypto & investments' },
  { id: 'games', name: 'Games', icon: 'Gamepad2', description: 'Entertainment & puzzles' },
];

export const INITIAL_APPS: AppItem[] = [
  // Social
  { id: 'telegram', name: 'Telegram', packageName: 'org.telegram.messenger', category: 'social', iconName: 'Send', color: '#2AABEE' },
  { id: 'signal', name: 'Signal', packageName: 'org.thoughtcrime.securesms', category: 'social', iconName: 'Shield', color: '#3A76F0' },
  { id: 'discord', name: 'Discord', packageName: 'com.discord', category: 'social', iconName: 'MessageSquare', color: '#5865F2' },
  { id: 'whatsapp', name: 'WhatsApp', packageName: 'com.whatsapp', category: 'social', iconName: 'PhoneCall', color: '#25D366' },
  { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage', category: 'social', iconName: 'Flame', color: '#FF4500' },
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', category: 'social', iconName: 'Camera', color: '#E4405F' },

  // Media
  { id: 'spotify', name: 'Spotify', packageName: 'com.spotify.music', category: 'media', iconName: 'Music', color: '#1DB954' },
  { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube', category: 'media', iconName: 'Video', color: '#FF0000' },
  { id: 'camera', name: 'Camera', packageName: 'com.android.camera', category: 'media', iconName: 'Aperture', color: '#00E5FF', isBaseline: true, isEmergencyAllowed: true },
  { id: 'photos', name: 'Google Photos', packageName: 'com.google.android.apps.photos', category: 'media', iconName: 'Image', color: '#4285F4' },
  { id: 'podcasts', name: 'Pocket Casts', packageName: 'au.com.shiftyjelly.pocketcasts', category: 'media', iconName: 'Radio', color: '#F43E37' },
  { id: 'netflix', name: 'Netflix', packageName: 'com.netflix.mediaclient', category: 'media', iconName: 'Tv', color: '#E50914' },

  // Work & Tools
  { id: 'gmail', name: 'Gmail', packageName: 'com.google.android.gm', category: 'work', iconName: 'Mail', color: '#EA4335' },
  { id: 'calendar', name: 'Calendar', packageName: 'com.google.android.calendar', category: 'work', iconName: 'Calendar', color: '#4285F4', isBaseline: true },
  { id: 'notes', name: 'Keep Notes', packageName: 'com.google.android.keep', category: 'work', iconName: 'FileText', color: '#F4B400' },
  { id: 'docs', name: 'Docs', packageName: 'com.google.android.apps.docs.editors.docs', category: 'work', iconName: 'File', color: '#4285F4' },
  { id: 'files', name: 'Files by Google', packageName: 'com.google.android.apps.nbu.files', category: 'work', iconName: 'Folder', color: '#34A853', isBaseline: true },
  { id: 'calculator', name: 'Calculator', packageName: 'com.google.android.calculator', category: 'work', iconName: 'Hash', color: '#00ACC1', isBaseline: true, isEmergencyAllowed: true },
  { id: 'maps', name: 'Google Maps', packageName: 'com.google.android.apps.maps', category: 'work', iconName: 'Compass', color: '#34A853', isBaseline: true, isEmergencyAllowed: true },
  { id: 'clock', name: 'Clock & Alarms', packageName: 'com.google.android.deskclock', category: 'work', iconName: 'Clock', color: '#FBBC05', isBaseline: true, isEmergencyAllowed: true },

  // Finance
  { id: 'revolut', name: 'Revolut', packageName: 'com.revolut.revolut', category: 'finance', iconName: 'CreditCard', color: '#0075FF' },
  { id: 'wallet', name: 'Google Wallet', packageName: 'com.google.android.apps.walletnfcrel', category: 'finance', iconName: 'Wallet', color: '#34A853', isEmergencyAllowed: true },
  { id: 'banking', name: 'Chase Mobile', packageName: 'com.chase.sig.android', category: 'finance', iconName: 'Landmark', color: '#117ACA' },
  { id: 'crypto', name: 'Coinbase', packageName: 'com.coinbase.android', category: 'finance', iconName: 'Coins', color: '#0052FF' },
  { id: 'robinhood', name: 'Robinhood', packageName: 'com.robinhood.android', category: 'finance', iconName: 'TrendingUp', color: '#00C805' },

  // Games
  { id: 'chess', name: 'Chess.com', packageName: 'com.chess', category: 'games', iconName: 'Award', color: '#7FA650' },
  { id: 'game2048', name: '2048 Minimal', packageName: 'com.gabrielecirulli.app2048', category: 'games', iconName: 'Grid', color: '#EDC22E' },
  { id: 'retroarch', name: 'RetroArch', packageName: 'com.retroarch', category: 'games', iconName: 'Gamepad', color: '#333333' },
  { id: 'monument', name: 'Monument Valley', packageName: 'com.ustwo.monumentvalley', category: 'games', iconName: 'Hexagon', color: '#9B51E0' },

  // System & Emergency (Never blocked)
  { id: 'phone', name: 'Phone Dialer', packageName: 'com.google.android.dialer', category: 'system', iconName: 'Phone', color: '#25D366', isBaseline: true, isEmergencyAllowed: true },
  { id: 'contacts', name: 'Contacts', packageName: 'com.google.android.contacts', category: 'system', iconName: 'Users', color: '#4285F4', isBaseline: true, isEmergencyAllowed: true },
  { id: 'messages', name: 'Messages', packageName: 'com.google.android.apps.messaging', category: 'system', iconName: 'MessageSquare', color: '#1A73E8', isBaseline: true, isEmergencyAllowed: true },
];

export const DEFAULT_CONTACTS = [
  { name: 'Dr. Sarah Evans (Physician)', number: '+1 (555) 234-5678', relation: 'Emergency Medical' },
  { name: 'Mom (Direct Line)', number: '+1 (555) 987-6543', relation: 'Family' },
  { name: 'Alex Johnson (Partner)', number: '+1 (555) 345-6789', relation: 'Primary Contact' },
  { name: 'Building Security Dispatch', number: '+1 (555) 456-7890', relation: 'Security' },
];
