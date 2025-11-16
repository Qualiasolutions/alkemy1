
export const THEME_COLORS = {
  background_primary: "#0B0B0B",
  background_secondary: "#121212",
  surface_card: "#161616",
  accent_primary: "#10A37F",
  accent_secondary: "#0E8C6D",
  text_primary: "#FFFFFF",
  text_secondary: "#B5B5B5",
  border_color: "#242424",
  divider_color: "#1A1A1A",
  hover_background: "#1B1B1B",
  active_background: "#202020",
  success: "#10A37F",
  warning: "#F5A524",
  error: "#F04438",
};

export const TABS_CONFIG = [
  {
    name: 'Development',
    tabs: [
      { id: 'script', name: 'Script', icon: '/script.svg' },
      { id: 'moodboard', name: 'Moodboard', icon: '/moodboard.svg' },
      { id: 'cast_locations', name: 'Cast & Locations', icon: '/cast_locations.svg' },
      { id: '3d_worlds', name: '3D Worlds', icon: '/worlds_3d.svg' },
      { id: 'compositing', name: 'Compositing', icon: '/compositing.svg' },
      { id: 'presentation', name: 'Presentation', icon: '/presentation.svg' },
    ],
  },
  {
    name: 'Production',
    tabs: [
      { id: 'timeline', name: 'Timeline', icon: '/timeline.svg' },
      { id: 'wan_transfer', name: 'Wan Transfer', icon: '/wan_transfer.svg' },
      { id: 'post_production', name: 'Post-Production', icon: '/post_production.svg' },
      { id: 'exports', name: 'Exports', icon: '/exports.svg' },
      { id: 'analytics', name: 'Analytics', icon: '/analytics.svg' },
    ],
  },
];

// A flattened array for convenience in other parts of the app (e.g., setting the default tab in App.tsx)
export const TABS = TABS_CONFIG.flatMap(group => group.tabs);
