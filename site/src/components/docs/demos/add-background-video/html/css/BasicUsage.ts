import '@videojs/html/media/background-video';

const initializedDemos = new WeakSet<HTMLElement>();

function initializeDemos(): void {
  document.querySelectorAll<HTMLElement>('.add-background-video-html-demo').forEach((hero) => {
    if (initializedDemos.has(hero)) return;

    initializedDemos.add(hero);

    const video = hero.querySelector('background-video')!.target!;
    const button = hero.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionRequest = 0;

    function setMotion(enabled: boolean) {
      const request = ++motionRequest;

      hero.toggleAttribute('data-motion-enabled', enabled);
      button.textContent = enabled ? 'Hide background motion' : 'Show background motion';

      if (enabled) {
        video.play().catch(() => {
          if (request === motionRequest) setMotion(false);
        });
      } else {
        video.pause();
      }
    }

    const syncPreference = () => setMotion(!preference.matches);

    button.addEventListener('click', () => setMotion(!hero.hasAttribute('data-motion-enabled')));
    preference.addEventListener('change', syncPreference);
    document.addEventListener(
      'astro:before-swap',
      () => {
        preference.removeEventListener('change', syncPreference);
        setMotion(false);
      },
      { once: true }
    );
    syncPreference();
  });
}

initializeDemos();
document.addEventListener('astro:page-load', initializeDemos);
