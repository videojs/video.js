#import "VideoJSPlayerRegistry.h"

#import <stdatomic.h>

@implementation VideoJSPlayerRegistry {
  /// Main queue only.
  NSMutableDictionary<NSNumber *, VideoJSPlayerEngine *> *_engines;

  _Atomic(int32_t) _lastHandle;
}

+ (VideoJSPlayerRegistry *)sharedRegistry
{
  static VideoJSPlayerRegistry *registry;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    registry = [[VideoJSPlayerRegistry alloc] init];
  });

  return registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    _engines = [NSMutableDictionary new];
    atomic_init(&_lastHandle, 0);
  }

  return self;
}

- (NSInteger)createPlayerWithSource:(nullable NSString *)source
{
  // Allocated from 1, so the 0 the Fabric props default to is unambiguously
  // "no player".
  NSInteger handle = atomic_fetch_add(&_lastHandle, 1) + 1;

  __weak __typeof(self) weakSelf = self;

  [self onMainQueue:^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf == nil) {
      return;
    }

    strongSelf->_engines[@(handle)] =
        [[VideoJSPlayerEngine alloc] initWithSource:source
                                            onEvent:^(VideoJSPlayerEventType type) {
                                              __typeof(self) registry = weakSelf;

                                              if (registry.onEvent != nil) {
                                                registry.onEvent(handle, type);
                                              }
                                            }];
  }];

  return handle;
}

- (void)destroyPlayer:(NSInteger)handle
{
  __weak __typeof(self) weakSelf = self;

  [self onMainQueue:^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf == nil) {
      return;
    }

    [strongSelf->_engines[@(handle)] invalidate];
    [strongSelf->_engines removeObjectForKey:@(handle)];
  }];
}

- (void)commandPlayer:(NSInteger)handle block:(void (^)(VideoJSPlayerEngine *))block
{
  __weak __typeof(self) weakSelf = self;

  [self onMainQueue:^{
    VideoJSPlayerEngine *engine = [weakSelf engineForHandle:handle];

    if (engine != nil) {
      block(engine);
    }
  }];
}

- (VideoJSPlayerEngine *)engineForHandle:(NSInteger)handle
{
  return _engines[@(handle)];
}

- (void)releaseAll
{
  __weak __typeof(self) weakSelf = self;

  [self onMainQueue:^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf == nil) {
      return;
    }

    for (VideoJSPlayerEngine *engine in strongSelf->_engines.allValues) {
      [engine invalidate];
    }

    [strongSelf->_engines removeAllObjects];
  }];
}

// Always dispatches, never runs inline on the main queue — inlining would let
// a command overtake a still-queued construction.
- (void)onMainQueue:(dispatch_block_t)block
{
  dispatch_async(dispatch_get_main_queue(), block);
}

@end
