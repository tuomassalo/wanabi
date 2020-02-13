import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client'
import * as dynamodbClient from 'serverless-dynamodb-client'
import * as gamebridge from './gamebridge'

const dynamodb: DocumentClient = dynamodbClient.doc

const connectionTable = 'WanabiConnections'

export const handler = async function(event: any, context: any) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  const {
    body,
    requestContext: {connectionId, routeKey},
  } = event
  console.log(`EVENT: ${event.requestContext.routeKey} ${connectionId}`, body, connectionId, routeKey)

  // quick workaround for prod
  let routeKey2
  try {
    routeKey2 = JSON.parse(body).action
  } catch (e) {}

  try {
    switch (routeKey) {
      case '$connect':
        await dynamodb
          .put({
            TableName: connectionTable,
            Item: {
              connectionId,
              // Expire the connection two hours later. This is optional, but recommended.
              // You will have to decide how often to time out and/or refresh the ttl.
              ttl: parseInt(String(Date.now() / 1000 + 2 * 3600)),
            },
          })
          .promise()
        break

      case '$disconnect':
        await dynamodb.delete({TableName: connectionTable, Key: {connectionId}}).promise()

        await gamebridge.purgeGames()
        break

      case '$default':
      default:
        console.warn('DEFAULT', {routeKey, routeKey2, connectionId, body})

        await gamebridge[routeKey2 || routeKey](JSON.parse(body).data, connectionId)
    }
  } catch (e) {
    console.warn('ERROR', e)
    throw e
  }

  // Return a 200 status to tell API Gateway the message was processed
  // successfully.
  // Otherwise, API Gateway will return a 500 to the client.
  return {statusCode: 200}
}
