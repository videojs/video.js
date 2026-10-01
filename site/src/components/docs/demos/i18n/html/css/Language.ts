import '@videojs/html/i18n';
import '@videojs/html/video/player';
import '@videojs/html/video/skin';

const locales = ['en', 'es', 'fr', 'de', 'ja', 'ar'];
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
const initializedDemos = new WeakSet<HTMLElement>();

function initializeDemos(): void {
  document.querySelectorAll<HTMLElement>('.html-i18n-language').forEach((demo) => {
    if (initializedDemos.has(demo)) return;

    initializedDemos.add(demo);

    const select = demo.querySelector('select');
    const provider = demo.querySelector('media-i18n');

    for (const locale of locales) {
      const option = document.createElement('option');

      option.value = locale;
      option.textContent = languageNames.of(locale) ?? locale;
      select?.append(option);
    }

    select?.addEventListener('change', () => {
      provider?.setAttribute('lang', select.value);
    });
  });
}

initializeDemos();
document.addEventListener('astro:page-load', initializeDemos);
