#import "VideoJSPlayerView.h"

#import "VideoJSPlayerRegistry.h"

#import <AVFoundation/AVFoundation.h>

#import <react/renderer/components/ReactNativeViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReactNativeViewSpec/Props.h>
#import <react/renderer/components/ReactNativeViewSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

/// `AVPlayerLayer` has to be the backing layer of whatever view hosts it, so it
/// can't be the component view's own — RCTViewComponentView uses that layer for
/// borders and backgrounds.
@interface VideoJSPlayerSurface : UIView
@property (nonatomic, readonly) AVPlayerLayer *playerLayer;
@end

@implementation VideoJSPlayerSurface

+ (Class)layerClass
{
  return AVPlayerLayer.class;
}

- (AVPlayerLayer *)playerLayer
{
  return (AVPlayerLayer *)self.layer;
}

@end

@implementation VideoJSPlayerView {
  VideoJSPlayerSurface *_surface;
  NSInteger _handle;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<VideoJSPlayerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const VideoJSPlayerViewProps>();
    _props = defaultProps;

    _surface = [[VideoJSPlayerSurface alloc] init];
    _surface.playerLayer.videoGravity = AVLayerVideoGravityResizeAspect;

    self.contentView = _surface;
  }

  return self;
}

- (void)dealloc
{
  [self bindHandle:0];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newViewProps = *std::static_pointer_cast<VideoJSPlayerViewProps const>(props);

  [self bindHandle:newViewProps.playerHandle];

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [self bindHandle:0];
  [super prepareForRecycle];
}

- (void)bindHandle:(NSInteger)next
{
  if (next == _handle) {
    return;
  }

  VideoJSPlayerRegistry *registry = VideoJSPlayerRegistry.sharedRegistry;

  [[registry engineForHandle:_handle] detachLayer:_surface.playerLayer];
  _handle = next;
  [[registry engineForHandle:next] attachLayer:_surface.playerLayer];
}

@end
