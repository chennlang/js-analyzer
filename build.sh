#!/bin/sh

#  ----------------- 清理历史 -----------------
# rm -rf ./packages/server/libs/core-dist/*
# rm -rf ./packagesserver/libs/web-dist/*

# #  ----------------- 构建 core -----------------
# echo "开始构建 core"
# cd packages/core
# pnpm install --no-frozen-lockfile
# pnpm run build
# cp -r dist/* ../server/libs/core-dist/

# cd ../../

#  ----------------- 构建 web -----------------
echo "开始构建 web"
cd packages/web
pnpm install --no-frozen-lockfile
pnpm run build
cp -r dist/* ../server/libs/web-dist/

cd ../../

