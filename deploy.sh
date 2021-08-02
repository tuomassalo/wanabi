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

. .env
if [ -z "$WEBROOT_SCP_TARGET" ]; then
    echo "Please add WEBROOT_SCP_TARGET='myhost:/my/dir/' to '.env'." >&2
    exit 1
fi

cd client
npm run build
scp -r build/* $WEBROOT_SCP_TARGET
cd ..

