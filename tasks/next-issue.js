module.exports = function(grunt) {
  grunt.registerTask('next-issue', 'Get the next issue that needs a response', function(){
    var done = this.async();
    var GitHubApi = require('github');
    var open = require('open');

    var github = new GitHubApi({
      // required
      version: '3.0.0',
      // optional
      debug: true,
      protocol: 'https',
      // host: 'github.my-GHE-enabled-company.com',
      // pathPrefix: '/api/v3', // for some GHEs
      timeout: 5000
    });

    github.issues.repoIssues({
      // optional:
      // headers: {
      //     'cookie': 'blahblah'
      // },
      user: 'videojs',
      repo: 'video.js',
      sort: 'updated',
      direction: 'asc',
      state: 'open',
      per_page: 100
    }, function(err, res) {
      var issueToOpen;
      var usersWithWrite = ['heff', 'mmcc'];
      var categoryLabels = ['enhancement', 'bug', 'question', 'feature'];

      console.log('Number of issues: '+res.length);

      // TODO: Find the best way to exclude an issue where a question has been asked of the
      // issue owner/submitter that hasn't been answerd yet.
      // A stupid simple first step would be to check for the needs: more info label
      // and exactly one comment (the question)

      // find issues that need categorizing, no category labels
      res.some(function(issue){
        if (issue.labels.length === 0) {
          return issueToOpen = issue; // break
        }
        // look for category labels
        var categorized = issue.labels.some(function(label){
          return categoryLabels.indexOf(label.name) >= 0;
        });
        if (!categorized) {
          return issueToOpen = issue; // break
        }
      });
      if (issueToOpen) {
        open(issueToOpen.html_url);
        return done();
      }

      // find issues that need confirming or answering
      res.some(function(issue){
        // look for confirmed label
        var confirmed = issue.labels.some(function(label){
          return label.name === 'confirmed';
        });
        // Was exluding questions, but that might leave a lot of people hanging
        // var question = issue.labels.some(function(label){
        //   return label.name === 'question';
        // });
        if (!confirmed) { //  && !question
          return issueToOpen = issue; // break
        }
      });
      if (issueToOpen) {
        open(issueToOpen.html_url);
        return done();
      }

      grunt.log.writeln('No next issue found');
      done();
    });
  });
}
