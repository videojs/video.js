module.exports = function(grunt) {
  // You can specify which browsers to build with by using grunt-style arguments
  // or separating them with a comma:
  //   grunt test:chrome:firefox  # grunt-style
  //   grunt test:chrome,firefox  # comma-separated
  grunt.registerTask('test-local', function() {
    let tasks = this.args;
    let tasksMinified;

    // if we aren't running this in a CI, but running it manually, we can
    // supply arguments to this task. These arguments are either colon (`:`)
    // separated which is the default grunt separator for arguments, or they
    // are comma (`,`) separated to make it easier.
    // The arguments are the names of which browsers you want.
    if (tasks.length === 0) {
      tasks.push('chrome');
    }
    if (tasks.length === 1) {
      tasks = tasks[0].split(',');
    }

    tasks = tasks.map((task) => `karma:${task}`);

    grunt.task.run(tasks);
  });
};
