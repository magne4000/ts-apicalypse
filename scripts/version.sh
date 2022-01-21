#!/usr/bin/env bash
set -e

read -p "major/minor/patch? " V

if [ "$V" != "major" ] && [ "$V" != "minor" ] && [ "$V" != "patch" ];
then
    echo "Could not bump version!"
    echo "Usage: 'npm run version -- (major|minor|patch)'"
    echo ""
    exit 1
fi

npm version $V -ws
NEW_VERSION=$(npx -w ts-apicalypse -c 'echo "$npm_package_version"')

git add ts-apicalypse ts-igdb
git commit -m 'Bump version'
git tag "v$NEW_VERSION"
echo "Bumped version to v$NEW_VERSION"

# Prompt for pushing
read -p "Push HEAD and tags to v$NEW_VERSION? y/n " PUSH
if [ $PUSH = "y" ]
then
    git push && git push --tags
else
    echo "Not pushing."
fi

exit 0
