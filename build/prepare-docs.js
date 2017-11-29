var sh = require('shelljs');

// delete the old directory
sh.rm('-rf', ['docs/api']);

// prepare the directory again
sh.mkdir('-p', 'docs/api');

// copy the legacy docs over
sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');
