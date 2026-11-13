// Single import point for the Swift-generated header. Objective-C++ files are
// compiled without C++ modules, so the generated header skips its own `@import`s
// and the frameworks its declarations use have to be imported first.
#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

#if __has_include(<VideoJS/VideoJS-Swift.h>)
#import <VideoJS/VideoJS-Swift.h>
#else
#import "VideoJS-Swift.h"
#endif
