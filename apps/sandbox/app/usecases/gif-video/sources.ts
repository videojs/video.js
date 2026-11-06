// Every source here is served with permissive CORS headers, which the GIF
// media needs because it fetches the file to decode frames rather than
// rendering it through an <img>.

export const GIF_VIDEO_SRC = 'https://image.mux.com/VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA/animated.gif';

/** A second Mux-rendered GIF, for grids and swapping sources. */
export const GIF_VIDEO_ALT_SRC = 'https://image.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/animated.gif';

export interface GifSource {
  readonly label: string;
  readonly url: string;
}

/** A small set with different frame rates, sizes, and disposal styles, for the skin and grid demos. */
export const GIF_SOURCES: readonly GifSource[] = [
  { label: 'Big Buck Bunny (Mux)', url: GIF_VIDEO_SRC },
  { label: 'Dancing (Mux)', url: GIF_VIDEO_ALT_SRC },
  {
    label: 'Rotating Earth (Wikimedia Commons)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
  },
  {
    label: "Newton's cradle (Wikimedia Commons)",
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Newtons_cradle_animation_book_2.gif',
  },
];
