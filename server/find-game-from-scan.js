const AWS = require('aws-sdk')

// usage:
// aws dynamodb scan --profile ts --table-name WanabiGames > foo.json
// node find-game-from-scan.js foo.json d8748bb7439eef9c8c09ee0def40b0cb8c49f29c

const gameId = process.argv.pop()
const scanFilename = process.argv.pop()

for (const gameBlob of JSON.parse(require('fs').readFileSync(scanFilename)).Items) {
  const game = AWS.DynamoDB.Converter.unmarshall(gameBlob)
  if (game.gameId === gameId) {
    console.log(JSON.stringify([game]))
  }
}
