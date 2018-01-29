import path from 'path';
import sh from 'shelljs';
import klawSync from 'klaw-sync';

const dest = 'docs/api/';
const distDest = path.join(dest, 'dist');
const exampleDest = path.join(dest, 'test-example');

export function cleanupExample() {
  sh.rm('-rf', distDest);
  sh.rm('-rf', exampleDest);
}

export default function generateExample({skipBuild}) {
  // run the build
  if (!skipBuild) {
    sh.exec('npm run build');
  }

  // make sure that the example dest is available
  sh.mkdir('-p', exampleDest);

  // copy the `dist` dir
  sh.cp('-R', 'dist', path.join(dest, 'dist'));

  const files = klawSync('sandbox/').filter((file) => path.extname(file.path) === '.example');

  // copy the sandbox example files
  files.forEach(function(file) {
    const p = path.parse(file.path);
    sh.cp(file.path, path.join(exampleDest, p.name));
  });
}
