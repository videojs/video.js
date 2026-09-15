#import <Foundation/Foundation.h>

#import "VideoJSPlayerEngine.h"

NS_ASSUME_NONNULL_BEGIN

/// Owns the engines addressed by handle, shared between the control TurboModule
/// and the Fabric surface so neither has to reach through the other. A
/// singleton because a Fabric component view is built by the mounting layer
/// with no way to inject the module that created the engine.
///
/// `createPlayer` is a synchronous method, so it lands on the JS thread while
/// the players are confined to the main queue. Handle allocation happens on the
/// caller's thread (cheap, atomic) and every engine touch is dispatched to the
/// main queue. Because dispatches are FIFO, a command issued in the same tick
/// as `createPlayer` runs after construction rather than against a missing
/// engine — the queueing the design requires falls out of the queue.
@interface VideoJSPlayerRegistry : NSObject

@property (nonatomic, copy, nullable) void (^onEvent)(NSInteger handle, VideoJSPlayerEventType type);

@property (class, nonatomic, readonly) VideoJSPlayerRegistry *sharedRegistry;

- (NSInteger)createPlayerWithSource:(NSString *)source;
- (void)destroyPlayer:(NSInteger)handle;
- (void)commandPlayer:(NSInteger)handle block:(void (^)(VideoJSPlayerEngine *engine))block;

/// Synchronous lookup for the Fabric surface. Safe because the surface only
/// mounts after `createPlayer` returned, so the construction dispatch is
/// already ahead of it in the main queue.
- (nullable VideoJSPlayerEngine *)engineForHandle:(NSInteger)handle;

- (void)releaseAll;

@end

NS_ASSUME_NONNULL_END
