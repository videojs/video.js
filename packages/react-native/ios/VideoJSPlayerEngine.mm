#import "VideoJSPlayerEngine.h"

NSString *VideoJSPlayerEventTypeJSName(VideoJSPlayerEventType type)
{
  switch (type) {
    case VideoJSPlayerEventTypePlaying:
      return @"playing";
    case VideoJSPlayerEventTypePaused:
      return @"paused";
    case VideoJSPlayerEventTypeEnded:
      return @"ended";
  }
}

static void *VideoJSPlayerTimeControlStatusContext = &VideoJSPlayerTimeControlStatusContext;

@implementation VideoJSPlayerEngine {
  AVQueuePlayer *_player;

  // The engine renders into the most recently attached layer only. Lower
  // entries stay registered so a pop can fall back to the layer below without
  // it having to re-register.
  NSMutableArray<AVPlayerLayer *> *_layers;

  void (^_onEvent)(VideoJSPlayerEventType);

  BOOL _invalidated;

  // AVPlayer has three time-control states but the JS contract has two, so
  // collapsing them can emit the same value twice (paused → buffering). Track
  // the last one to match ExoPlayer's change-only semantics.
  BOOL _hasLastType;
  VideoJSPlayerEventType _lastType;
}

- (instancetype)initWithSource:(nullable NSString *)source onEvent:(void (^)(VideoJSPlayerEventType))onEvent
{
  if (self = [super init]) {
    _onEvent = [onEvent copy];
    _layers = [NSMutableArray new];

    // Always an AVQueuePlayer, even with looping off, so enabling loop later
    // never changes player identity — see decisions.md § iOS looping uses an
    // always-present AVQueuePlayer.
    _player = [[AVQueuePlayer alloc] init];

    // The queue default advances past the finished item, leaving nothing to
    // render. Holding keeps the last frame up, matching ExoPlayer.
    _player.actionAtItemEnd = AVPlayerActionAtItemEndPause;

    [_player addObserver:self
              forKeyPath:@"timeControlStatus"
                 options:NSKeyValueObservingOptionNew
                 context:VideoJSPlayerTimeControlStatusContext];

    [NSNotificationCenter.defaultCenter addObserver:self
                                          selector:@selector(handleItemDidPlayToEnd:)
                                              name:AVPlayerItemDidPlayToEndTimeNotification
                                            object:nil];

    if (source != nil) {
      [self setSource:source];
    }
  }

  return self;
}

// AVQueuePlayer documents replaceCurrentItem: as unsupported, so the swap goes
// through the queue. removeAllItems drops the rate, so a player that was
// playing is restarted to match ExoPlayer's surviving `playWhenReady`.
- (void)setSource:(NSString *)source
{
  NSURL *url = [NSURL URLWithString:source];
  AVPlayerItem *item = url == nil ? nil : [AVPlayerItem playerItemWithURL:url];
  BOOL wasPlaying = _player.timeControlStatus != AVPlayerTimeControlStatusPaused;

  [_player removeAllItems];

  if (item == nil) {
    return;
  }

  [_player insertItem:item afterItem:nil];

  if (wasPlaying) {
    [_player play];
  }
}

- (void)dealloc
{
  // KVO observers must be gone before the observed player is torn down, and
  // the player dies with us.
  [self invalidate];
}

- (void)play
{
  [_player play];
}

- (void)pause
{
  [_player pause];
}

- (void)attachLayer:(AVPlayerLayer *)layer
{
  [_layers removeObjectIdenticalTo:layer];
  [_layers addObject:layer];
  [self repointLayers];
}

- (void)detachLayer:(AVPlayerLayer *)layer
{
  [_layers removeObjectIdenticalTo:layer];
  layer.player = nil;
  [self repointLayers];
}

- (void)invalidate
{
  if (_invalidated) {
    return;
  }

  _invalidated = YES;

  [_player removeObserver:self forKeyPath:@"timeControlStatus" context:VideoJSPlayerTimeControlStatusContext];
  [NSNotificationCenter.defaultCenter removeObserver:self];

  for (AVPlayerLayer *layer in _layers) {
    layer.player = nil;
  }

  [_layers removeAllObjects];
  [_player pause];
  [_player removeAllItems];

  _onEvent = nil;
}

// Only one layer may draw a given player, so the top of the stack takes it and
// everything below is cleared.
- (void)repointLayers
{
  AVPlayerLayer *top = _layers.lastObject;

  for (AVPlayerLayer *layer in _layers) {
    layer.player = layer == top ? _player : nil;
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if (context != VideoJSPlayerTimeControlStatusContext) {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    return;
  }

  AVPlayerTimeControlStatus status =
      (AVPlayerTimeControlStatus)[change[NSKeyValueChangeNewKey] integerValue];

  // Buffering reports as not-playing, which is what ExoPlayer's `isPlaying`
  // does too.
  VideoJSPlayerEventType type = status == AVPlayerTimeControlStatusPlaying
      ? VideoJSPlayerEventTypePlaying
      : VideoJSPlayerEventTypePaused;

  [self emitOnMainQueue:type];
}

- (void)handleItemDidPlayToEnd:(NSNotification *)notification
{
  __weak __typeof(self) weakSelf = self;

  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;

    // The notification is unfiltered, so ignore items belonging to other engines.
    if (strongSelf == nil || notification.object != strongSelf->_player.currentItem) {
      return;
    }

    [strongSelf emit:VideoJSPlayerEventTypeEnded];
  });
}

// KVO and notification delivery aren't guaranteed on the main queue, but the
// dedupe state and the player are.
- (void)emitOnMainQueue:(VideoJSPlayerEventType)type
{
  __weak __typeof(self) weakSelf = self;

  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf emit:type];
  });
}

- (void)emit:(VideoJSPlayerEventType)type
{
  if (_invalidated || (_hasLastType && _lastType == type)) {
    return;
  }

  _hasLastType = YES;
  _lastType = type;

  if (_onEvent != nil) {
    _onEvent(type);
  }
}

@end
