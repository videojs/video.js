import browserslist from 'browserslist';

import rootPackage from '../../../../package.json' with { type: 'json' };

const browsers = browserslist(rootPackage.browserslist);

function minimum(name: string): string {
  const version = browsers
    .filter((entry) => entry.startsWith(`${name} `))
    .map((entry) => entry.slice(name.length + 1).split('-')[0]!)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  if (!version) throw new Error(`The root browserslist has no supported ${name} version.`);

  return version;
}

export const versions = {
  chrome: minimum('chrome'),
  edge: minimum('edge'),
  firefox: minimum('firefox'),
  safari: minimum('safari'),
  // BrowserStack selects iOS by major version; round up to stay within the supported range.
  ios: String(Math.ceil(Number(minimum('ios_saf')))),
};
