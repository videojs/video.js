# Report for Assignment 1

## Project chosen

Name: video.js

URL: https://github.com/videojs/video.js

Number of lines of code and the tool used to count it: 68299

Programming language: JavaScript

## Coverage measurement

### Existing tool
The existing coverage tool that we use for this project is Istanbul. The coverage of this tool has already been implemented in the project and what we have to do is to enable the coverage tool on.

After digging around and getting some basic knowledge and intuition about the project, we figured out the way to enable the test procedure to return the coverage report under the HTML format:

In both rollup.config.js and karma.conf.js files:

This is the initial value of const CI_TEST_TYPE:
![Description of the image](https://github.com/thinhrick0101/demo/blob/main/t%E1%BA%A3i%20xu%E1%BB%91ng.jpeg)
