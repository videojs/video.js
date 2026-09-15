#import <React/RCTBridgeModule.h>
#import <ReactNativeViewSpec/ReactNativeViewSpec.h>

NS_ASSUME_NONNULL_BEGIN

/// The single control interface: engines addressed by handle, plus one event
/// channel tagged by handle that the JS adapter demuxes. Deliberately
/// view-independent so a player stays controllable with no surface mounted.
@interface VideoJSPlayerStore : NativePlayerStoreSpecBase <NativePlayerStoreSpec, RCTInvalidating>
@end

NS_ASSUME_NONNULL_END
