#!/usr/bin/env bash
if [ "$1" != "major" ] && [ "$1" != "minor" ] && [ "$1" != "patch" ];
then
    echo "Could not bump version!"
    echo "Usage: 'npm run version -- (major|minor|patch)'"
    echo ""
    exit 1
fi

NEW_VERSION=$(npm version $1 -ws)

git add */package.json */package-lock.json
git commit -m 'Bump version'
git tag $NEW_VERSION
echo "Bumped version to $NEW_VERSION"

# Prompt for pushing
read -p "Push HEAD and tags to $NEW_VERSION? y/n " PUSH
if [ $PUSH = "y" ]
then
    git push && git push --tags
else
    echo "Not pushing."
fi