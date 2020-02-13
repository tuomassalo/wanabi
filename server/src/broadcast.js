const AWS = require('aws-sdk')
import * as dynamodbClient from 'serverless-dynamodb-client'
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT,
  sslEnabled: process.env.APIG_ENDPOINT?.startsWith('https://'),
})
const dynamodb = dynamodbClient.doc

const connectionTable = 'WanabiConnections' // process.env.CONNECTIONS_TABLE

async function sendMessage(connectionId, body) {
  try {
    await apig
      .postToConnection({
        ConnectionId: connectionId,
        Data: body,
      })
      .promise()
  } catch (err) {
    // Ignore if connection no longer exists
    if (err.statusCode !== 400 && err.statusCode !== 410) {
      throw err
    }
  }
}

async function getAllConnections(ExclusiveStartKey) {
  // const ret = await dynamodb.doc.listTables({})

  const {Items, LastEvaluatedKey} = await dynamodb
    .scan({
      TableName: connectionTable,
      AttributesToGet: ['connectionId'],
      ExclusiveStartKey,
    })
    .promise()

  const connections = Items.map(({connectionId}) => connectionId)
  if (LastEvaluatedKey) {
    connections.push(...(await getAllConnections(LastEvaluatedKey)))
  }

  return connections
}

exports.handler = async function(event, context) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  console.log('EVENT: \n' + JSON.stringify(event, null, 2))

  const {body} = event
  const connections = await getAllConnections()

  await Promise.all(connections.map(connectionId => sendMessage(connectionId, body)))
}
