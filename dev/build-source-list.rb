#! /usr/bin/env ruby
# Create javascript file with list of source files for easy inclusion in other development files.

# puts ARGV[0]

File.open("source-list.js", "w+") do |file|
  file.puts "var vjsSourceList = [];"
  
  
  Dir.foreach('../src') do |item|
    next if item == '.' or item == '..' or item == '.DS_Store'

    file.puts "vjsSourceList.push('src/#{item}')"

  end

end