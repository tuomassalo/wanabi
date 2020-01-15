import * as AWS from 'aws-sdk'
import {Game} from 'wanabi-engine'

// const AWS = require('aws-sdk')
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT,
  sslEnabled: false,
})
const dynamodb = new AWS.DynamoDB.DocumentClient({endpoint: 'http://localhost:8000'})

const connectionTable = 'WanabiGame'

export const handler = async function(event: any, context: any) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  console.log(`EVENT: ${event.requestContext.routeKey}`)

  const {
    body,
    requestContext: {connectionId, routeKey},
  } = event
  switch (routeKey) {
    case '$connect':
      await dynamodb
        .put({
          TableName: connectionTable,
          Item: {
            connectionId,
            // Expire the connection an hour later. This is optional, but recommended.
            // You will have to decide how often to time out and/or refresh the ttl.
            ttl: parseInt(String(Date.now() / 1000 + 3600)),
          },
        })
        .promise()
        // let i = 1
        // setInterval(()  =>
        await apig
        .postToConnection({
          ConnectionId: connectionId,
          Data: `HELLO`,
        }).promise()
        // .promise(), 1000)
      break

    case '$disconnect':
      await dynamodb
        .delete({
          TableName: connectionTable,
          Key: {connectionId},
        })
        .promise()
      break

    case 'routeA':
      const g = new Game({playerNames: ['foo', 'bar']})
      // console.warn(g.toJSON());
      const foo = 'FOO' +g
      await apig
        .postToConnection({
          ConnectionId: connectionId,
          Data: `Received on routeAx: ${foo}`,
          // Data: `Received on routeAx: ${JSON.stringify(g.toJSON()).substring(0,100)}`,
        })
        .promise()
      break

    case '$default':
    default:
      await apig
        .postToConnection({
          ConnectionId: connectionId,
          Data: `Received on $default: ${body}`,
        })
        .promise()
  }

  // Return a 200 status to tell API Gateway the message was processed
  // successfully.
  // Otherwise, API Gateway will return a 500 to the client.
  return {statusCode: 200}
}
