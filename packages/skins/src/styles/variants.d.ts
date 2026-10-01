import 'vjsc/styles';

/** The variants the skins build selects: one theme, one preset, and Shadow DOM for HTML targets. */
declare module 'vjsc/styles' {
  interface StyleVariants {
    default: true;
    neutral: true;
    compat: true;
    video: true;
    audio: true;
    'live-video': true;
    'live-audio': true;
    'shadow-dom': true;
  }
}
