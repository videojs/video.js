#import "VideoJSPlayerStore.h"

#import "VideoJSPlayerRegistry.h"

@implementation VideoJSPlayerStore

RCT_EXPORT_MODULE(VideoJSPlayerStore)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    __weak __typeof(self) weakSelf = self;

    VideoJSPlayerRegistry.sharedRegistry.onEvent = ^(NSInteger handle, VideoJSPlayerEventType type) {
      [weakSelf emitOnPlayerEvent:@{
        @"handle" : @(handle),
        @"type" : VideoJSPlayerEventTypeJSName(type),
      }];
    };
  }

  return self;
}

- (NSNumber *)createPlayer:(NSString *)source
{
  return @([VideoJSPlayerRegistry.sharedRegistry createPlayerWithSource:source]);
}

- (void)destroyPlayer:(NSInteger)handle
{
  [VideoJSPlayerRegistry.sharedRegistry destroyPlayer:handle];
}

- (void)play:(NSInteger)handle
{
  [VideoJSPlayerRegistry.sharedRegistry commandPlayer:handle
                                                block:^(VideoJSPlayerEngine *engine) {
                                                  [engine play];
                                                }];
}

- (void)pause:(NSInteger)handle
{
  [VideoJSPlayerRegistry.sharedRegistry commandPlayer:handle
                                                block:^(VideoJSPlayerEngine *engine) {
                                                  [engine pause];
                                                }];
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
  return std::make_shared<facebook::react::NativePlayerStoreSpecJSI>(params);
}

@end
