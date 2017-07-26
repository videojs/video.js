#!/usr/bin/env bash

echo "Release Type?"
read -rp "> " rtype

echo grunt version:${rtype}
grunt version:${rtype}
version=$(./build/bin/version)

echo New version is $version

# echo grunt chg-release:$version
# grunt chg-release:$version
npm run changelog

echo git commit -am "v$version"
git commit -am "v$version"

echo git checkout temp-release-branch
git checkout -b temp-release-branch

echo grunt dist
grunt dist

echo git add -f dist
git add -f dist

echo git commit -m "v$version dist"
git commit -m "v$version dist"

echo git tag -a "v$version" -m "v$version"
git tag -a "v$version" -m "v$version"

echo git show
git show


read -p "publish? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Nn]$  ]]
then
 exit 0
fi

echo git push upstream
git push upstream --tags
git push origin --tags

echo npm publish --tag next-5
npm publish --tag next-5

echo grunt github-release:prereleease
grunt github-release:prerelease

echo git checkout -
git checkout -

echo git branch -D temp-release-branch
git branch -D temp-release-branch
