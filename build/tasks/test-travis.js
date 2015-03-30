module.exports = function(grunt) {
  // The test task will run `karma:saucelabs` when running in travis,
  // when running via a PR from a fork, it'll run qunit tests in phantom using
  // karma otherwise, it'll run the tests in chrome via karma
  // You can specify which browsers to build with by using grunt-style arguments
  // or separating them with a comma:
  //   grunt test:chrome:firefox  # grunt-style
  //   grunt test:chrome,firefox  # comma-separated
  grunt.registerTask('test-travis', function() {
    var tasks = this.args;
    var tasksMinified;

    // I believe this was done originally because of security implications around running
    // Saucelabs automatically on PRs.
    if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
      grunt.task.run(['karma:firefox']);
    } else {
      grunt.task.run(['karma:firefox']);
      //Disabling saucelabs until we figure out how to make it run reliably.
      //grunt.task.run([
      //'karma:chrome_sl',
      //'karma:firefox_sl',
      //'karma:safari_sl',
      //'karma:ipad_sl',
      //'karma:android_sl',
      //'karma:ie_sl'
      //]);
    }
  });
};
