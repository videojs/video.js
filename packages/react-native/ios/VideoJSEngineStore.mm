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

    VideoJSPlayerRegistry.sharedRegistry.onEvent = ^(NSInteger handle, NSDictionary<NSString *, id> *event) {
      NSMutableDictionary *payload = [event mutableCopy];
      payload[@"handle"] = @(handle);
      [weakSelf emitOnPlayerEvent:payload];
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

// Each returns whether the handle reached a live engine.

- (NSNumber *)setSource:(NSInteger)handle source:(NSString *)source
{
  VideoJSPlayerEngine *engine = [self engineForHandle:handle];
  [engine setSource:source];
  return @(engine != nil);
}

- (NSNumber *)load:(NSInteger)handle
{
  VideoJSPlayerEngine *engine = [self engineForHandle:handle];
  [engine load];
  return @(engine != nil);
}

- (NSNumber *)play:(NSInteger)handle
{
  VideoJSPlayerEngine *engine = [self engineForHandle:handle];
  [engine play];
  return @(engine != nil);
}

- (NSNumber *)pause:(NSInteger)handle
{
  VideoJSPlayerEngine *engine = [self engineForHandle:handle];
  [engine pause];
  return @(engine != nil);
}

- (NSNumber *)setCurrentTime:(NSInteger)handle time:(double)time
{
  VideoJSPlayerEngine *engine = [self engineForHandle:handle];
  [engine setCurrentTime:time];
  return @(engine != nil);
}

- (NSNumber *)getCurrentTime:(NSInteger)handle
{
  return @([self stateForHandle:handle].currentTime);
}

- (NSNumber *)getDuration:(NSInteger)handle
{
  return @([self stateForHandle:handle].duration);
}

- (NSArray<NSDictionary *> *)getBuffered:(NSInteger)handle
{
  return [self stateForHandle:handle].buffered;
}

- (NSArray<NSDictionary *> *)getSeekable:(NSInteger)handle
{
  return [self stateForHandle:handle].seekable;
}

- (NSDictionary *_Nullable)getError:(NSInteger)handle
{
  return [self stateForHandle:handle].error;
}

- (NSNumber *)isPaused:(NSInteger)handle
{
  return @([self stateForHandle:handle].paused);
}

- (NSNumber *)isEnded:(NSInteger)handle
{
  return @([self stateForHandle:handle].ended);
}

- (NSNumber *)isSeeking:(NSInteger)handle
{
  return @([self stateForHandle:handle].seeking);
}

- (NSString *)getSource:(NSInteger)handle
{
  return [self stateForHandle:handle].currentSrc;
}

- (NSNumber *)getReadyState:(NSInteger)handle
{
  return @([self stateForHandle:handle].readyState);
}

- (NSDictionary *)getContentData:(NSInteger)handle
{
  return [self stateForHandle:handle].contentData;
}

- (NSNumber *)getPlaybackRate:(NSInteger)handle
{
  return @([self stateForHandle:handle].playbackRate);
}

- (VideoJSPlayerEngine *_Nullable)engineForHandle:(NSInteger)handle
{
  return [VideoJSPlayerRegistry.sharedRegistry engineForHandle:handle];
}

// Reads the engine's published snapshot on the calling (JS) thread, without
// waiting on the main queue.
- (VideoJSPlayerState *)stateForHandle:(NSInteger)handle
{
  return [VideoJSPlayerRegistry.sharedRegistry stateForHandle:handle];
}

// The registry outlives the module (it has to, for the Fabric surface), so a
// reload has to clear it explicitly or engines from the previous instance keep
// playing.
- (void)invalidate
{
  VideoJSPlayerRegistry.sharedRegistry.onEvent = nil;
  [VideoJSPlayerRegistry.sharedRegistry releaseAll];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeEngineStoreSpecJSI>(params);
}

@end
