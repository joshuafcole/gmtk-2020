#!/usr/bin/env bash

mkdir tmp
cp -r dist tmp/dist
cp -r assets tmp/assets
cp -r ugc tmp/ugc
cp index.html tmp
rm human-simulator-2020.zip
cd tmp
zip -r ../human-simulator-2020.zip *
cd ..
rm -r tmp
