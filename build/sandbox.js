const fs = require('fs');
const path = require('path');
const klawSync = require('klaw-sync');

const files = klawSync('sandbox/').filter((file) => path.extname(file.path) === '.example');

const changes = files.map(function(file) {
  const p = path.parse(file.path);
  const nonExample = path.join(p.dir, p.name);
  return {
    file: file.path,
    copy: nonExample
  };
})
.filter(function(change) {
  return !fs.existsSync(change.copy);
});

changes.forEach(function(change) {
  fs.copyFileSync(change.file, change.copy);
});

if (changes.length) {
  console.log("Updated Sandbox files for:");
  console.log('\t' + changes.map((chg) => chg.copy).join('\n\t'));
} else {
  console.log("No sandbox updates necessary");
}
