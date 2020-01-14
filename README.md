## Serverless installation

First, add aws creds.

### Dev

```sh
# first run only: install local dynamodb (creates `.dynamodb` directory)
sls dynamodb install

# Start the serverless-offline services: api gateway and dynamodb
npm run localbackend

# Run react dev web server
npm run webstart

# Then open http://localhost:8080/ in browser

# To try broadcasting a message to all listening clients
npm run localbroadcast
```

### Deploy

[TODO!]

```sh
# Deploy to AWS first
npm run sls -- deploy

```
