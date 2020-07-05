#!/bin/bash -x

cd $(dirname $0)

set -e
cd engine
npm run build
cd ..

cd server
npm run deploy
export REACT_APP_WS_ENDPOINT=$(jq --raw-output .ServiceEndpointWebsocket < data.json)
cd ..


cd client
npm run build
scp -r build/* venko.net:/var/www/wanabi.venko.net/
cd ..

