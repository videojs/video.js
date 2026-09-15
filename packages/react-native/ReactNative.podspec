require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/videojs/v10"
  s.license      = package["license"]
  s.authors      = "Video.js contributors"

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/videojs/v10.git", :tag => "@videojs/react-native@#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.frameworks = "AVFoundation"

  install_modules_dependencies(s)
end
