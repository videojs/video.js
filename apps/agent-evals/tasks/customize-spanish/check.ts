import type { TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion } from '../../src/grade/task-checks.ts';

// Control labels from the shipped Spanish pack (`@videojs/core/i18n/locales/es`) and their English defaults.
const PLAY = 'Reproducir';
const SPANISH = new Set([
  'Pausar',
  'Volver a reproducir',
  'Silenciar',
  'Activar el sonido',
  'Pantalla completa',
  'Salir de pantalla completa',
  'Activar subtítulos',
  'Desactivar subtítulos',
  'Imagen en imagen',
  'Salir de imagen en imagen',
  'Configuración',
  'Iniciar transmisión',
  'Detener transmisión',
  'Iniciar AirPlay',
  'Detener AirPlay',
]);
const ENGLISH = new Set([
  'Play',
  'Pause',
  'Replay',
  'Mute',
  'Unmute',
  'Enter fullscreen',
  'Exit fullscreen',
  'Enable captions',
  'Disable captions',
  'Enter picture-in-picture',
  'Exit picture-in-picture',
  'Settings',
  'Start casting',
  'Stop casting',
  'Start AirPlay',
  'Stop AirPlay',
]);

/**
 * The play button's accessible name is the Spanish pack's, and so are the other controls': at least one more control
 * reads Spanish and none still reads English.
 */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page, playButton }) => {
  const name = async () => (await playButton.getAttribute('aria-label').catch(() => null)) ?? '';
  let play = await name();

  // A locale pack can load after first paint.
  for (const deadline = Date.now() + 5_000; play !== PLAY && Date.now() < deadline;) {
    await page.waitForTimeout(250);
    play = await name();
  }

  const labels: string[] = [];

  for (const button of await allShown(page.getByRole('button'))) {
    const label = (await button.getAttribute('aria-label')) ?? (await button.textContent()) ?? '';

    labels.push(label.trim());
  }

  const spanish = labels.filter((label) => SPANISH.has(label));
  const english = labels.filter((label) => ENGLISH.has(label));

  return [
    assertion(`play button reads "${PLAY}"`, play === PLAY, play ? `"${play}"` : 'no label'),
    assertion(
      'other controls in Spanish',
      spanish.length > 0 && english.length === 0,
      `Spanish: ${spanish.join(', ') || 'none'}; English: ${english.join(', ') || 'none'}`
    ),
  ];
};
