import { describe, expect, it, vi } from 'vite-plus/test';

describe('HTML preset exports', () => {
  it('do not register custom elements when imported', async () => {
    const define = vi.spyOn(customElements, 'define');

    const [video, audio, liveVideo, liveAudio, background] = await Promise.all([
      import('../video'),
      import('../audio'),
      import('../live-video'),
      import('../live-audio'),
      import('../background'),
    ]);

    expect(define).not.toHaveBeenCalled();
    expect(video.VideoPlayerElement).toBeTypeOf('function');
    expect(video.VideoSkinElement).toBeTypeOf('function');
    expect(video.MinimalVideoSkinElement).toBeTypeOf('function');
    expect(audio.AudioPlayerElement).toBeTypeOf('function');
    expect(audio.AudioSkinElement).toBeTypeOf('function');
    expect(audio.MinimalAudioSkinElement).toBeTypeOf('function');
    expect(liveVideo.LiveVideoPlayerElement).toBeTypeOf('function');
    expect(liveVideo.LiveVideoSkinElement).toBeTypeOf('function');
    expect(liveVideo.MinimalLiveVideoSkinElement).toBeTypeOf('function');
    expect(liveAudio.LiveAudioPlayerElement).toBeTypeOf('function');
    expect(liveAudio.LiveAudioSkinElement).toBeTypeOf('function');
    expect(liveAudio.MinimalLiveAudioSkinElement).toBeTypeOf('function');
    expect(background.BackgroundVideoPlayerElement).toBeTypeOf('function');
    expect(background.BackgroundVideoSkinElement).toBeTypeOf('function');

    define.mockRestore();
  });
});
