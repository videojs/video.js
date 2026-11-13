#import "VideoJSEngineStore.h"

#import "VideoJSSwift.h"

@implementation VideoJSEngineStore

RCT_EXPORT_MODULE(VideoJSEngineStore)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    __weak __typeof(self) weakSelf = self;

    VideoJSPlayerRegistry.sharedRegistry.onChange = ^(NSInteger handle, NSDictionary<NSString *, id> *change) {
      NSMutableDictionary *payload = [change mutableCopy];
      payload[@"handle"] = @(handle);
      [weakSelf emitOnPlayerChange:payload];
    };
  }

  return self;
}

- (NSNumber *)createPlayer:(NSString * _Nullable)source
{
  return @([VideoJSPlayerRegistry.sharedRegistry createPlayerWithSource:source]);
}

- (void)destroyPlayer:(NSInteger)handle
{
  [VideoJSPlayerRegistry.sharedRegistry destroyPlayer:handle];
}

// Each returns its own update, or nil when the handle has no live engine.

- (NSDictionary *_Nullable)setSource:(NSInteger)handle source:(NSString *)source
{
  return [[self engineForHandle:handle] setSource:source];
}

- (NSDictionary *_Nullable)load:(NSInteger)handle
{
  return [[self engineForHandle:handle] load];
}

- (NSDictionary *_Nullable)play:(NSInteger)handle
{
  return [[self engineForHandle:handle] play];
}

- (NSDictionary *_Nullable)pause:(NSInteger)handle
{
  return [[self engineForHandle:handle] pause];
}

- (NSDictionary *_Nullable)setCurrentTime:(NSInteger)handle time:(double)time
{
  return [[self engineForHandle:handle] setCurrentTime:time];
}

- (NSDictionary *_Nullable)setPlaybackRate:(NSInteger)handle rate:(double)rate
{
  return [[self engineForHandle:handle] setPlaybackRate:rate];
}

- (NSDictionary *_Nullable)setLoop:(NSInteger)handle loop:(BOOL)loop
{
  return [[self engineForHandle:handle] setLoop:loop];
}

// Reads the engine's state on the calling (JS) thread, without waiting on the
// main queue.
- (NSDictionary *)getState:(NSInteger)handle
{
  return [VideoJSPlayerRegistry.sharedRegistry updateForHandle:handle];
}

- (VideoJSPlayerEngine *_Nullable)engineForHandle:(NSInteger)handle
{
  return [VideoJSPlayerRegistry.sharedRegistry engineForHandle:handle];
}

// The registry outlives the module (it has to, for the Fabric surface), so a
// reload has to clear it explicitly or engines from the previous instance keep
// playing.
- (void)invalidate
{
  VideoJSPlayerRegistry.sharedRegistry.onChange = nil;
  [VideoJSPlayerRegistry.sharedRegistry releaseAll];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeEngineStoreSpecJSI>(params);
}

@end
