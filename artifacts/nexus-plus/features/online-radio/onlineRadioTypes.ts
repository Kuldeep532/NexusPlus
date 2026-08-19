export type RadioStation = {
  id: string;
  name: string;
  language: string;
  city: string;
  category: string;
  streamUrl: string;
  websiteUrl?: string;
};

export const INDIAN_RADIO_STATIONS: RadioStation[] = [
  { id: 'air-delhi', name: 'All India Radio Delhi', language: 'Hindi', city: 'New Delhi', category: 'News & Talk', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8' },
  { id: 'air-mumbai', name: 'All India Radio Mumbai', language: 'Hindi', city: 'Mumbai', category: 'News & Talk', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio002/playlist.m3u8' },
  { id: 'air-bangalore', name: 'All India Radio Bengaluru', language: 'Kannada', city: 'Bengaluru', category: 'News & Culture', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio003/playlist.m3u8' },
  { id: 'air-chennai', name: 'All India Radio Chennai', language: 'Tamil', city: 'Chennai', category: 'News & Culture', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio004/playlist.m3u8' },
  { id: 'air-kolkata', name: 'All India Radio Kolkata', language: 'Bengali', city: 'Kolkata', category: 'News & Culture', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio005/playlist.m3u8' },
  { id: 'air-hyderabad', name: 'All India Radio Hyderabad', language: 'Telugu', city: 'Hyderabad', category: 'News & Culture', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio006/playlist.m3u8' },
];

export const RADIO_CATEGORIES = ['All', 'News & Talk', 'News & Culture', 'Music', 'Devotional', 'Regional'];
