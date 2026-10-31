// Served from public/presets, so the path is the same in dev, in dist/ and on native.
// Items store the URL itself, so these paths must never change.
export const PRESET_PHOTO_URLS = {
  kyotoGarden: '/presets/kyoto-moss-garden.jpg',
  libraryDesk: '/presets/library-reading-table.jpg',
  ceramicVessel: '/presets/artisan-ceramic-teapot.jpg',
  cinemaTheater: '/presets/arthouse-cinema.jpg',
};

export const PRESET_PHOTOS = [
  { label: 'Kyoto Moss Garden', url: PRESET_PHOTO_URLS.kyotoGarden },
  { label: 'Library Reading Table', url: PRESET_PHOTO_URLS.libraryDesk },
  { label: 'Artisan Ceramic Teapot', url: PRESET_PHOTO_URLS.ceramicVessel },
  { label: 'Arthouse Cinema Theater', url: PRESET_PHOTO_URLS.cinemaTheater },
];

// Older builds saved dev-server-only paths, which are broken in production; normalizeItems swaps them
export const LEGACY_PRESET_PATHS: Record<string, string> = {
  '/src/assets/images/kyoto_temple_garden_1793277649785.jpg': PRESET_PHOTO_URLS.kyotoGarden,
  '/src/assets/images/bookstack_library_desk_1793277650295.jpg': PRESET_PHOTO_URLS.libraryDesk,
  '/src/assets/images/artisan_ceramic_vessel_1793277650446.jpg': PRESET_PHOTO_URLS.ceramicVessel,
  '/src/assets/images/arthouse_cinema_theater_1793277651133.jpg': PRESET_PHOTO_URLS.cinemaTheater,
};
