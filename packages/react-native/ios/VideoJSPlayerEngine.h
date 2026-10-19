#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Mirrors `PlayerEvent['type']` in `src/NativeEngineStore.ts`.
typedef NS_ENUM(NSInteger, VideoJSPlayerEventType) {
  VideoJSPlayerEventTypePlaying,
  VideoJSPlayerEventTypePaused,
  VideoJSPlayerEventTypeEnded,
};

extern NSString *VideoJSPlayerEventTypeJSName(VideoJSPlayerEventType type);

/// One player behind one handle. Confined to the main queue — every entry point
/// is reached either from `VideoJSPlayerRegistry`'s main-queue dispatch or from
/// the Fabric surface, which is already on the main queue.
@interface VideoJSPlayerEngine : NSObject

/// A nil source leaves the player idle until `setSource:` supplies one.
- (instancetype)initWithSource:(nullable NSString *)source
                       onEvent:(void (^)(VideoJSPlayerEventType type))onEvent
    NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

- (void)setSource:(NSString *)source;

- (void)play;
- (void)pause;

- (void)attachLayer:(AVPlayerLayer *)layer;
- (void)detachLayer:(AVPlayerLayer *)layer;

- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
