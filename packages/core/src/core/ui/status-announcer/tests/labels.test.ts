import { formatTimeAsPhrase } from '@videojs/utils/time';
import { describe, expect, it } from 'vite-plus/test';

import { createTranslator } from '../../../i18n';
import { createStatusAnnouncerLabels } from '../labels';

describe('createStatusAnnouncerLabels', () => {
  it('maps parameterized announcement phrases', () => {
    const labels = createStatusAnnouncerLabels(createFrenchTranslator(), 'fr');

    expect(labels.volumeWithValue('80%')).toBe('Volume : 80%');
    expect(labels.seekedTo(90)).toBe(`Position de lecture : ${formatTimeAsPhrase(90, { locale: 'fr' })}`);
    expect(labels.playbackRate('1.5×')).toBe('Vitesse de lecture 1.5×');
  });
});

function createFrenchTranslator() {
  return createTranslator(
    {
      'volume.muted': 'Muet',
      'volume.value': 'Volume : {value}',
      'status.seekedTo': 'Position de lecture : {time}',
      'playback.rate': 'Vitesse de lecture {rate}',
    },
    'fr'
  );
}
