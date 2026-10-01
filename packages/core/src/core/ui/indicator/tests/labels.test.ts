import { describe, expect, it } from 'vite-plus/test';

import { createTranslator, type FlatTranslations } from '../../../i18n';
import { createInputIndicatorLabels } from '../labels';

describe('createInputIndicatorLabels', () => {
  it('maps indicator phrases to input feedback labels', () => {
    const labels = createInputIndicatorLabels(createFrenchTranslator());

    expect(labels.captionsOn).toBe('Sous-titres activés');
    expect(labels.captionsOff).toBe('Sous-titres désactivés');
    expect(labels.paused).toBe('En pause');
    expect(labels.volume).toBe('Volume');
  });
});

function createFrenchTranslator() {
  return createTranslator(
    {
      'volume.muted': 'Muet',
      'volume.label': 'Volume',
      'volume.value': 'Volume : {value}',
      'status.captionsOn': 'Sous-titres activés',
      'status.captionsOff': 'Sous-titres désactivés',
      'status.paused': 'En pause',
      'status.playing': 'Lecture en cours',
      'status.fullscreen': 'Plein écran',
      'fullscreen.exit': 'Quitter le plein écran',
      'status.pip': 'Image dans l’image',
      'status.exitPip': 'Quitter l’image dans l’image',
      'status.seekedTo': 'Position de lecture : {time}',
      'playback.rate': 'Vitesse de lecture {rate}',
    } satisfies FlatTranslations,
    'fr'
  );
}
