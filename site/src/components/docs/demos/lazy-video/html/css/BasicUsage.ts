import '@videojs/html/media/lazy-video';

const lazyVideo = document.querySelector('.html-lazy-video-basic__media')!;

for (const button of document.querySelectorAll<HTMLButtonElement>('.html-lazy-video-basic__sources button')) {
  button.addEventListener('click', () => lazyVideo.setAttribute('src', button.dataset.src!));
}
