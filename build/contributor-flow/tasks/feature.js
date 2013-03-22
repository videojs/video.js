(function(){
  'use strict';

  module.exports = function(grunt) {
    var prompt = require('prompt');
    var branch = require('./lib/branch');
    var log = require('./lib/log');
    var shell = require('./lib/shell');
    var pullRequest = require('./lib/pullrequest');

    // Set up the Github connection for pull requests
    var GithubAPI = require('github');
    var github = new GithubAPI({
        // required
        version: '3.0.0',
        // optional
        timeout: 5000
    });

    var Feature = {};

    Feature.start = function(name, options, callback){
      if (!name) {
        prompt.start();
        prompt.get({
          name: 'name',
          message: '\nName of the feature:',
          validator: /^[a-z0-9\-]+$/,
          warning: 'Names can only contain dashes, 0-9, and a-z',
          required: true
        }, function (err, result) {
          if (err) { return callback(err); }
          startGit(result.name, {}, callback);
        });
      } else {
        startGit(name, {}, callback);
      }

      function startGit(name, options, callback) {
        var branchName = 'feature/' + name;

        branch.update('master', { upstream: true }, function(err){
          if (err) { return callback(err); }

          branch.create(branchName, { base: 'master' }, function(err){
            if (err) { return callback(err); }

            branch.push(branchName, {}, function(err){
              if (err) { return callback(err); }

              branch.track(branchName, {}, function(err){
                if (!err) { log('Ready to start building your feature!'); }
                callback(err);
              });
            });
          });
        });
      }
    };

    Feature.del = function(featureName, options, callback){
      Feature.getBranchName(featureName, {}, function(err, branchName){
        if (err) { return callback(err); }
        confirmDelete(branchName, callback);
      });

      function confirmDelete(branchName, callback) {
        prompt.start();
        prompt.get({
          name: 'yesno',
          message: '\nAre you sure you want to delete '+branchName+'?',
          validator: /y[es]*|n[o]?/,
          warning: 'Must respond yes or no',
          'default': 'no'
        }, function (err, result) {
          if (err) { callback(err); }

          if (result.yesno === 'yes' || result.yesno === 'y') {
            deleteGit(branchName, {}, callback);
          } else {
            callback('Delete branch aborted');
          }
        });
      }

      function deleteGit(branchName, options, callback) {
        branch.checkout('master', {}, function(err){
          if (err) { return callback(err); }

          branch.deleteLocal(branchName, {}, function(err){
            if (err) { return callback(err); }

            branch.deleteRemote(branchName, {}, function(err){
              if (!err) { log('Feature deleted'); }
              callback(err);
            });
          });
        });
      }
    };

    Feature.submit = function(featureName, options, callback){
      var upstreamOwner, baseBranchName;

      options = options || {};
      upstreamOwner = options.upstreamOwner || 'zencoder';
      baseBranchName = options.baseBranchName || 'master';

      Feature.getBranchName(featureName, {}, function(err, branchName){
        if (err) { return callback(err); }
        submitToGithub(branchName, {}, callback);
      });

      function submitToGithub(branchName, options, callback) {
        // Ask for Github credentials
        var schema = {
          properties: {
            username: {
              description: 'Github Username',
              pattern: /^[a-zA-Z\s\-]+$/,
              message: 'Name must be only letters, spaces, or dashes',
              required: true
            },
            password: {
              description: 'Github Password',
              hidden: true,
              required: true
            },
            title: {
              description: 'Please title the pull request',
              required: true
            },
            body: {
              description: 'Please describe the feature',
              required: false
            }
          }
        };

        prompt.start();
        prompt.get(schema, function (err, result) {
          if (err) { return callback(err); }

          // Authentication is synchronus and only works for the next API call
          // This could be changed to store a token, which is how zenflow does it
          github.authenticate({
              type: 'basic',
              username: result.username,
              password: result.password
          });

          github.pullRequests.create({
            user: upstreamOwner,
            repo: 'video-js',
            title: result.title,
            body: result.body,
            head: result.username + ':' + branchName,
            base: baseBranchName
          }, function(err, result){
            if (!err) { log('Feature submitted!'); }
            callback(err);
          });
        });
      }
    };

    Feature.test = function(pullId, options, callback){

      if (!pullId) {
        pullRequest.askForId(function(err, id){
          if (err) { return callback(err); }
          getPullRequests(id, {}, callback);
        });
      } else {
        getPullRequests(pullId, {}, callback);
      }

      function getPullRequests(pullId, options, callback){
        github.pullRequests.getAll({
          user: 'zencoder',
          repo: 'video-js',
          state: 'open'
        }, handlePullRequests);
      }

      function handlePullRequests(err, pulls){
        var branchName, gitUrl, owner;

        if (err) { return callback(err); }

        pulls.forEach(function(pull){
          if (pull.number === parseInt(pullId, 10)) {
            branchName = pull.head.ref;
            gitUrl = pull.head.repo.git_url;
            owner = pull.head.repo.owner.login;

            branch.update('master', { upstream: true }, function(){
              branch.create(owner + '_' + branchName, {
                base: 'master',
                url: gitUrl + ' ' + branchName
              }, function(err){
                grunt.task.run('test');
                if (!err) { log(branchName + ' copied into your local repo'); }
                callback(err);
              });
            });
          }
        });
      }
    };

    Feature.accept = function(pullId, options, callback){
      var branchName;

      if (pullId) {
        confirmAccept(pullId, options, callback);
      } else {
        Feature.getPullRequest(null, options, function(err, pull){
          if (err) { return callback(err); }
          confirmAccept(pull.number, options, callback);
        });
      }

      function confirmAccept(pullId, options, callback) {
        Feature.confirm('Are you sure you want to merge pull request '+pullId+'?', options, function(err, result){
          if (err) { return callback(err); }
          if (result === 'no') {
            callback('Feature accept aborted');
          } else {
            acceptCmds(pullId, options, callback);
          }
        });
      }

      function acceptCmds(pullId, options, callback){
        shell.run('pulley '+pullId, {}, callback);
      }
    };

    Feature.getPullRequest = function(featureName, options, callback){
      var branchName;

      options = options || {};

      if (featureName) {
        branchName = 'feature/'+featureName;
        if (options.owner) {
          branchName = options.owner + '_' + branchName;
        }
        return branch.getPullRequest(branchName, {}, callback);
      }

      // Use current branch name
      Feature.getBranchName(null, {}, function(err, branchName){
        if (err) {
          return pullRequest.askForId(callback);
        }
        branch.getPullRequest(branchName, {}, callback);
      });
    };

    Feature.getBranchName = function(featureName, options, callback){
      var type = 'feature';

      function success(featureName){
        callback(null, type + '/' + featureName);
      }

      if (!featureName) {
        branch.current({ changeType: type }, function(err, info){
          if (err) { return callback(err); }
          success(info.changeName);
        });
      } else {
        success(featureName);
      }
    };

    Feature.confirm = function(question, options, callback) {
      prompt.start();
      prompt.get({
        name: 'yesno',
        message: '\n' + question,
        validator: /y[es]*|n[o]?/,
        warning: 'Must respond yes or no',
        'default': 'no'
      }, function (err, result) {
        if (err) { return callback(err); }

        if (result.yesno === 'yes' || result.yesno === 'y') {
          callback(null, 'yes');
        } else {
          callback(null, 'no');
        }
      });
    };

    grunt.registerTask('feature', 'Creating distribution', function(action, option, option2){
      var done, owner, branch;

      done = this.async();

      function taskCallback(err){
        if (err) {
          grunt.log.error(err);
          return done(false);
        }
        done(true);
      }

      // Start a new feature
      if (action === 'start') {
        Feature.start(option, {}, taskCallback);

      // Delete a feature
      } else if (action === 'delete') {
        Feature.del(option, {}, taskCallback);

      // Submit a feature via pull request
      } else if (action === 'submit') {
        Feature.submit(option, {
          upstreamOwner: grunt.option('owner'), // CLI flag
          baseBranchName: grunt.option('branch') // CLI flag
        }, taskCallback);

      // Download the branch from a pull requst and run tests
      } else if (action === 'test') {
        Feature.test(option, {}, taskCallback);

      } else if (action === 'accept') {
        Feature.accept(option, {}, taskCallback);
      }
    });
  };
})();
