import { createPlayer } from '@videojs/react';
import { I18nProvider } from '@videojs/react/i18n';
import { Video, VideoSkin, videoFeatures } from '@videojs/react/video';
import { useState } from 'react';

import '@videojs/react/video/skin.css';
import './Language.css';

const { Player } = createPlayer({ features: videoFeatures });
const locales = ['en', 'es', 'fr', 'de', 'ja', 'ar'] as const;

type Locale = (typeof locales)[number];
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export default function Language() {
  const [locale, setLocale] = useState<Locale>('en');

  return (
    <div className="react-i18n-language">
      <label>
        Language
        <select value={locale} onChange={(event) => setLocale(event.currentTarget.value as Locale)}>
          {locales.map((value) => (
            <option key={value} value={value}>
              {languageNames.of(value) ?? value}
            </option>
          ))}
        </select>
      </label>
      <Player>
        <I18nProvider locale={locale}>
          <VideoSkin className="react-i18n-language__player">
            <Video src="{{VJS10_DEMO_VIDEO_MP4}}" muted playsInline />
          </VideoSkin>
        </I18nProvider>
      </Player>
    </div>
  );
}
