require 'rubygems'
require 'yaml'
require 'httparty'

namespace :build do

  task :test do
    Rake::Log['CDN_VERSION = false'.gsub('CDN_VERSION = false', 'hi')]
    
  end

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

    combined << File.read("flash/swfobject.js")
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
    Rake::Shell["cp LGPLv3-LICENSE.txt dist/LGPLv3-LICENSE.txt"]

    Rake::Log["Minimizing JavaScript"]
    Rake::Shell["java -jar build/lib/yuicompressor-2.4.7.jar dist/video.js -o dist/video.min.js"]

    Rake::Log["Minimizing CSS"]
    Rake::Shell["java -jar build/lib/yuicompressor-2.4.7.jar dist/video-js.css -o dist/video-js.min.css"]

    Rake::Log[version_number << " Built"]    
  end


end

def version
  YAML.load(File.read("VERSION.yml"))
end

def version_number
  "#{version['major']}.#{version['minor']}.#{version['patch']}"
end

desc "Set up the environment"
task :setup do
  Rake::Log["Installing jekyll"]
  Rake::Shell["gem install jekyll"]
  Rake::Log["Installing the RDiscount gem for decent Markdown support"]
  Rake::Shell["gem install rdiscount"]
  Rake::Log["Installing Pygments for syntax highlighting"]
  Rake::Shell["easy_install pygments"]
  if !File.exist?("_config.yml")
    Rake::Log["Setting up _config.yml"]
    Rake::Shell["cp _config.yml.example _config.yml"]
  end
  Rake::Log["SSH configuration should go in ~/.ssh/config:\n\nHost static1\n  Hostname static1.zencoder.com\n  Port 22777\n  User deploy\n\nHost static2\n  Hostname static2.zencoder.com\n  Port 22777\n  User deploy"]

  Rake::Log["!!! SYNTAX HIGHLIGHTING WIHT PYGMENTS REQUIRED liquid version 2.2.2"]
  Rake::Log["gem list -d liquid"]
  Rake::Log["If not 2.2.2"]
  Rake::Log["gem uninstall liquid"]
  Rake::Log['gem install liquid --version "2.2.2"']
end

namespace :site do
  desc "Delete site cache"
  task :delete do
    Rake::Log["Deleting site cache"]
    if File.exist?("_site")
      Rake::Shell["rm -r _site"]
    end
  end

  desc "Build the site cache"
  task :build do
    Rake::Log["Building site cache"]
    Rake::Shell["jekyll --no-server --no-auto"]
  end

  desc "Rebuild the site cache"
  task :rebuild do
    Rake::Task["site:delete"].execute
    Rake::Task["site:build"].execute
  end

end

# Using the HTML5 Boilerplate build script to optimize files
namespace :hb do

  desc "Udate H5BP Page List config property"
  task :update do
    Rake::Log["Updating H5BP Page List (_site/build/config/project.properties)"]
    text = File.read("_site/build/config/project.properties")
    pages = File.read("_site/page-list-for-h5bp.html")
    File.open("_site/build/config/project.properties", "w") do |file|
      file.puts text.gsub(/file\.pages\s+=.*/, "file.pages = " << pages)
    end
  end

  desc "Optimize the site cache using the HTML5 Boilerplate build script. Creates a new folder called 'publish' inside _site folder"
  task :build do
    Rake::Task["hb:update"].execute

    Rake::Log["Optimizing site cache"]
    Rake::Shell["cd _site/build/ && ant build && cd ../.."]
  end
end


namespace :env do
  desc "Change to development environment"
  task :development do
    Rake::Log["Changing to development environment"]
    set_env_to :development
  end

  desc "Change to staging environment"
  task :staging do
    Rake::Log["Changing to staging environment"]
    set_env_to :staging
  end

  desc "Change to production environment"
  task :production do
    Rake::Log["Changing to production environment"]
    set_env_to :production
  end
end

namespace :deploy do
  task :update_local do
    Rake::Log["Updating local git repo and pushing changes"]
    Rake::Shell["git pull && git push"]
  end

  desc "Deploy to staging"
  task :staging do
    Rake::Task["deploy:update_local"].execute
    Rake::Log["Rebuilding for staging"]
    Rake::Task["env:staging"].execute
    Rake::Task["site:rebuild"].execute
    Rake::Task["hb:build"].execute
    config["servers"]["staging"].each do |server|
      Rake::Log["Deploying to #{server.split(':').first}"]
      Rake::Shell["rsync -avrzth --delete _site/publish/ #{server}"]
    end
    Rake::Log["Rebuilding for development"]
    Rake::Task["env:development"].execute
    Rake::Task["site:rebuild"].execute
  end

  desc "Deploy to production"
  task :production do
    Rake::Task["deploy:update_local"].execute
    Rake::Log["Rebuilding for production"]
    Rake::Task["env:production"].execute
    Rake::Task["site:rebuild"].execute
    Rake::Task["hb:build"].execute
    config["servers"]["production"].each do |server|
      Rake::Log["Deploying to #{server.split(':').first}"]
      Rake::Shell["rsync -avrzth --delete _site/publish/ #{server}"]
    end
    Rake::Log["Rebuilding for development"]
    Rake::Task["env:development"].execute
    Rake::Task["site:rebuild"].execute
  end
end

namespace :docs do

  desc "Generate Doc directories and pages from VideoJS library docs"
  task :generate do

    Rake::Log["Getting docs from " << config["videojs_dir"]]

    if File.exist?("docs")
      Rake::Shell["rm -r docs"]
    end
    Dir.mkdir("docs");

    list = "<ul><li id='docs_nav_start'><a href='/docs/'>Start</a></li>\n"
    list << "<ul><li id='docs_nav_setup'><a href='/docs/setup/'>Setup</a></li>\n"
    list << "<ul><li id='docs_nav_options'><a href='/docs/options/'>Options</a></li>\n"

    Dir.foreach(config["videojs_dir"] << '/docs') do |item|
      next if item == '.' or item == '..'

      # do work on real items
      Rake::Log[item]

      text = File.read(config["videojs_dir"] << "/docs/" << item)
      name = item.gsub(/\.md/, "")

      if name == 'index'
        filename = "docs/" << "index.md"
        File.open(filename, "w+") do |file|
          file.puts "" << text
        end
      else
        filename = "docs/" << name << "/index.md"
        Dir.mkdir("docs/" << name)
        if name != "glossary" and name != "setup" and name != "options"
          list << "<li id='docs_nav_#{name}'><a href='/docs/#{name}/'>#{name}</a></li>\n"
        end
      end

      File.open(filename, "w+") do |file|
        file.puts "" << text
      end

    end

    File.open("_includes/docs_menu.html", "w+") do |file|
      file.puts list << "<li id='docs_nav_glossary'><a href='/docs/glossary/'>glossary</a></li></ul>"
    end
  end

end


def set_env_to(env)
  text = File.read("_config.yml")
  File.open("_config.yml", "w") do |file|
    file.puts text.gsub(/env:.*/, "env: #{env}")
  end
end

def config
  YAML.load(File.read("_config.yml"))
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
