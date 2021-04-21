#! /bin/bash
#
# Setup directory structure to that expected by Solutions as described at https://valence.solutions.architecture.aws.a2z.com/#/developer-guide
#
# Run this script in the ./solutions directory
# set -x

HOMEDIR="$(echo $(cd ../ && pwd))"
SOURCEDIR=$HOMEDIR/source
echo "create /source"
if [ -d "$SOURCEDIR" ]; then rm -rf $SOURCEDIR; fi
if [ ! -d "$SOURCEDIR" ]; then mkdir $SOURCEDIR; fi

# Copy source code 
if [ -d "$HOMEDIR/frontend/node_modules" ]; then rm -Rf $HOMEDIR/frontend/node_modules; fi
echo "copy to /source/frontend"
mv $HOMEDIR/frontend $SOURCEDIR

if [ -d "$HOMEDIR/backend/node_modules" ]; then rm -Rf $HOMEDIR/backend/node_modules; fi
echo "copy to /source/backend"
mv $HOMEDIR/backend $SOURCEDIR

if [ -d "$HOMEDIR/cdk/node_modules" ]; then rm -Rf $HOMEDIR/cdk/node_modules; fi
if [ -d "$HOMEDIR/cdk/cdk.out" ]; then rm -Rf $HOMEDIR/cdk/cdk.out; fi
echo "copy to /source/cdk"
mv $HOMEDIR/cdk $SOURCEDIR

echo "copy scripts to /source"
mv $HOMEDIR/install.sh $SOURCEDIR
mv $HOMEDIR/deploy.sh $SOURCEDIR
mv $HOMEDIR/test.sh $SOURCEDIR
mv $HOMEDIR/release.sh $SOURCEDIR
cp package.sh $SOURCEDIR

# Copy top level docs to expected names
echo "setup top level *.md files"
mv $HOMEDIR/LICENSE $HOMEDIR/LICENSE.md
mv $HOMEDIR/NOTICE $HOMEDIR/NOTICE.txt

cp $HOMEDIR/solutions/buildspec.yml $HOMEDIR
cp $HOMEDIR/solutions/.viperlightignore $HOMEDIR
cp $HOMEDIR/solutions/.viperlightrc $HOMEDIR
cp $HOMEDIR/solutions/CHANGELOG.md $HOMEDIR
