// Set up the Github connection for pull requests
var GithubAPI = require('github');
var github = new GithubAPI({
    // required
    version: '3.0.0',
    // optional
    timeout: 5000
});
var prompt = require('prompt');

var PR = {};

PR.askForId = function(callback){
  prompt.start();
  prompt.get({
    name: 'pullId',
    message: '\nPull request ID',
    validator: /^[0-9]+$/,
    warning: 'ID must be an integer',
    required: true
  }, function (err, result) {
    if (err) { return callback(err); }

    github.pullRequests.get({
      user: 'zencoder',
      repo: 'video-js',
      number: result.pullId
    }, callback);
  });
};

module.exports = PR;


