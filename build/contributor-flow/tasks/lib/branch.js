var branch = {};
var shell = require('./shell.js');
var log = require('./log.js');
// Set up the Github connection for pull requests
var GithubAPI = require('github');
var github = new GithubAPI({
    // required
    version: '3.0.0',
    // optional
    timeout: 5000
});

branch.parseName = function(name){
  var match, changeType, changeName, owner, ownerBranchName, tempName;

  tempName = name;

  match = tempName.match(/([^_]+)_(.*)/);
  if (match) {
    owner = match[1];
    ownerBranchName = match[2];
    tempName = ownerBranchName;
  }

  match = tempName.match(/([^\/]+)\/(.*)/);
  if (match) {
    changeType = match[1];
    changeName = match[2];
  }

  return {
    name: name,
    changeType: changeType,
    changeName: changeName,
    owner: owner,
    ownerBranchName: ownerBranchName
  };
};

branch.current = function(options, callback){
  var name, info;
  options = options || {};

  shell.run('git rev-parse --abbrev-ref HEAD', { logging: false }, function(err, stdout){
    if (err) { return callback(err); }

    name = stdout.replace('\n', '');
    info = branch.parseName(name);

    if (options.changeType && options.changeType !== info.changeType) {
      return callback('You are not in a ' + options.changeType + ' branch');
    }

    callback(null, info);
  });
};

branch.create = function(name, options, callback){
  options = options || {};
  var base = options.base || 'master';
  var cmd = 'git checkout -b '+name+' '+base;

  if (options.url) {
    cmd += ' && git pull ' + options.url;
  }

  log('Creating the '+name+' branch based on '+base);
  shell.run(cmd, callback);
};

branch.update = function(name, options, callback){
  options = options || {};
  var message = 'Updating the '+name+' branch';
  var cmd = 'git checkout '+name+' && git pull';

  if (options.upstream === true) {
    message += ' with upstream changes';
    cmd += ' upstream '+name;
  }

  log(message);
  shell.run(cmd, callback);
};

branch.push = function(name, options, callback){
  log('Pushing the '+name+' branch to origin');
  shell.run('git push origin '+name, callback);
};

branch.track = function(name, options, callback){
  log('Tracking the '+name+' branch against origin/'+name);
  shell.run('git branch --set-upstream '+name+' origin/'+name, callback);
};

branch.checkout = function(name, options, callback){
  log('Switching to the '+name+' branch');
  shell.run('git checkout '+name, callback);
};

branch.deleteLocal = function(name, options, callback){
  log('Removing the local branch');
  shell.run('git branch -D '+name, callback);
};

branch.deleteRemote = function(name, options, callback){
  log('Removing the remote branch from origin');
  shell.run('git push origin :'+name, callback);
};

branch.getPullRequest = function(branchName, options, callback){
  var pr;

  github.pullRequests.getAll({
    user: 'zencoder',
    repo: 'video-js',
    state: 'open'
  }, function(err, pulls){
    if (err) { return callback(err); }

    pulls.forEach(function(pull){
      if (branchName === pull.head.ref) {
        pr = pull;
      }
    });

    if (pr) {
      callback(null, pr);
    } else {
      callback('No pull request found or this branch');
    }
  });
};

module.exports = branch;
