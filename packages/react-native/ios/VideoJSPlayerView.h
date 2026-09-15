#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// A window onto an engine owned by `VideoJSPlayerStore`. Holds no playback
/// state and issues no commands — it registers its layer with the engine for
/// the handle it is given and renders whatever that engine plays.
@interface VideoJSPlayerView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
