export interface VideojsRegistryMeta {
  readonly role: 'component' | 'skin' | 'support';
  readonly framework: 'html' | 'react';
  readonly styling?: 'css' | 'tailwind' | undefined;
  readonly preset?: 'audio' | 'live-audio' | 'live-video' | 'video' | undefined;
  readonly media?: 'audio' | 'video' | undefined;
  readonly theme?: 'default' | 'neutral' | undefined;
  readonly public: boolean;
}
