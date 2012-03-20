require 'rubygems'
require 'yaml'
require 'httparty'

namespace :build do

  desc "Build version for current '/c/' CDN copy and locked in version"
  task :current do
    Rake::Task["build:source"].execute

    cdn_version_num = "#{version['major']}.#{version['minor']}"

    ['c', cdn_version_num].each do |vsn|
      Rake::Shell["mkdir dist/#{vsn}"]

      File.open("dist/#{vsn}/video.js", "w+") do |file|
        file.puts File.read("dist/video.min.js").sub('GENERATED_CDN_VSN', vsn)
      end

      Rake::Shell["cp dist/video-js.min.css dist/#{vsn}/video-js.css"]
      Rake::Shell["cp dist/video-js.swf dist/#{vsn}/video-js.swf"]
      Rake::Shell["cp dist/video-js.png dist/#{vsn}/video-js.png"]
      Rake::Shell["cp dist/demo.html dist/#{vsn}/demo.html"]
      Rake::Shell["cp dist/captions.vtt dist/#{vsn}/captions.vtt"]
    end

    Rake::Shell["mkdir dist/video-js"]

    File.open("dist/video-js/video.min.js", "w+") do |file|
      file.puts File.read("dist/video.min.js").sub('GENERATED_CDN_VSN', cdn_version_num)
    end

    File.open("dist/video-js/video.js", "w+") do |file|
      file.puts File.read("dist/video.js").sub('GENERATED_CDN_VSN', cdn_version_num)
    end

    Rake::Shell["cp dist/video-js.min.css dist/video-js/video-js.min.css"]
    Rake::Shell["cp dist/video-js.css dist/video-js/video-js.css"]
    Rake::Shell["cp dist/video-js.swf dist/video-js/video-js.swf"]
    Rake::Shell["cp dist/video-js.png dist/video-js/video-js.png"]
    Rake::Shell["cp dist/demo.html dist/video-js/demo.html"]
    Rake::Shell["cp dist/captions.vtt dist/video-js/captions.vtt"]

    Rake::Shell["cd dist && zip -r video-js-#{version_number}.zip video-js && cd .."]

    if `git name-rev --name-only HEAD`.strip != 'stable'
      Rake::Log["*** WARNING: NOT ON STABLE BRANCH!!! ***"]
    end
  end

  desc "Build source files for packaging"
  task :source do
    Rake::Log["Building Version: " << version_number]

    if File.exist?("dist")
      Rake::Shell["rm -r dist"]
    end

    # Make distribution folder
    Rake::Shell["mkdir dist"]

    Rake::Log["Combining source files"]
    combined = ""

    first_files = [ '_begin.js', 'core.js', 'lib.js' ]

    first_files.each do |item|
      Rake::Log[item]
      combined << File.read("src/#{item}")
    end

    Dir.foreach('src') do |item|
      next if (['.', '..', '.DS_Store', 'setup.js', '_end.js'] + first_files).include? item
      combined << File.read("src/#{item}")
    end

    # combined << File.read("flash/swfobject.js")
    combined << File.read("src/setup.js")
    combined << File.read("src/_end.js")

    Rake::Log["Adding version number"]
    combined = combined.gsub('GENERATED_AT_BUILD', version_number)

    File.open('dist/video.js', "w+") do |file|
      file.puts "" << combined
    end

    Rake::Log["Copying CSS and updated version"]
    File.open('dist/video-js.css', "w+") do |file|
      file.puts File.read("design/video-js.css").gsub('GENERATED_AT_BUILD', version_number)
    end

    Rake::Log["Copying suppporting files"]
    Rake::Shell["cp design/video-js.png dist/video-js.png"]
    Rake::Shell["cp flash/video-js.swf dist/video-js.swf"]

    Rake::Shell["cp build/release-files/README.md dist/README.md"]
    Rake::Shell["cp build/release-files/demo.html dist/demo.html"]
    Rake::Shell["cp build/release-files/captions.vtt dist/captions.vtt"]
    Rake::Shell["cp LGPLv3-LICENSE.txt dist/LGPLv3-LICENSE.txt"]

    Rake::Log["Minimizing JavaScript"]
    Rake::Shell["java -jar build/lib/yuicompressor-2.4.7.jar dist/video.js -o dist/video.min.js"]

    Rake::Log["Minimizing CSS"]
    Rake::Shell["java -jar build/lib/yuicompressor-2.4.7.jar dist/video-js.css -o dist/video-js.min.css"]

    Rake::Log[version_number << " Built"]
  end

  desc "Build list of source files for easy inclusion in projects"
  task :js_source do

    File.open("dev/source-list.js", "w+") do |file|
      file.puts "var vjsSourceList = [];"

      src_array = ["src/core", "src/lib"]
      last = ["src/setup"] # "flash/swfobject", 
      exclude = [".", "..", ".DS_Store", "_end.js", "_begin.js"]

      Dir.foreach('src') do |item|
        next if exclude.include? item

        item_name = "src/" << item.sub(".js", "")

        next if (src_array + last).include? item_name

        src_array << item_name
      end

      src_array = src_array + last

      src_array.each do |item|
        file.puts "vjsSourceList.push('#{item}')"
      end
      # file.puts "vjsSourceList.push('src/#{item.sub(".js", "")}')"
      # file.puts "vjsSourceList.push('flash/swfobject.js')"

    end
  end
  
  desc "Build list of source files for easy inclusion in projects"
  task :source_html do

    File.open("dev/source-list.html", "w+") do |file|
      file.puts "<!-- Video.js Source Files -->"

      src_array = ["src/core", "src/lib"]
      last = ["src/setup"] # "flash/swfobject", 
      exclude = [".", "..", ".DS_Store", "_end.js", "_begin.js"]

      Dir.foreach('src') do |item|
        next if exclude.include? item

        item_name = "src/" << item.sub(".js", "")

        next if (src_array + last).include? item_name

        src_array << item_name
      end

      src_array = src_array + last

      src_array.each do |item|
        file.puts "<script src='#{item}.js'></script>"
      end
      # file.puts "vjsSourceList.push('src/#{item.sub(".js", "")}')"
      # file.puts "vjsSourceList.push('flash/swfobject.js')"
      
      file.puts "<!-- END Video.js Source Files -->"

    end
  end

end

def version
  YAML.load(File.read("VERSION.yml"))
end

def version_number
  "#{version['major']}.#{version['minor']}.#{version['patch']}"
end

module Rake
  class Shell
    def self.[](command)
      output = %x[#{command}]
      if $?.to_i > 0
        puts "-----> Process aborted"
        puts "       Exit status: #{$?}"
        exit($?.to_i)
      end
      puts output
    end
  end

  class Log
    def self.[](message)
      puts "-----> #{message.split("\n").join("\n       ")}"
    end
  end
end
