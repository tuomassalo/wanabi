"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var AWS = require('aws-sdk');
var apig = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.APIG_ENDPOINT,
    sslEnabled: false
});
var dynamodb = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localhost:8000' });
var connectionTable = 'WanabiGame';
exports.handler = function (event, context) {
    return __awaiter(this, void 0, void 0, function () {
        var body, _a, connectionId, routeKey, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // For debug purposes only.
                    // You should not log any sensitive information in production.
                    console.log('EVENT: \n' + JSON.stringify(event, null, 2));
                    body = event.body, _a = event.requestContext, connectionId = _a.connectionId, routeKey = _a.routeKey;
                    _b = routeKey;
                    switch (_b) {
                        case '$connect': return [3 /*break*/, 1];
                        case '$disconnect': return [3 /*break*/, 3];
                        case 'routeA': return [3 /*break*/, 5];
                        case '$default': return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 7];
                case 1: return [4 /*yield*/, dynamodb
                        .put({
                        TableName: connectionTable,
                        Item: {
                            connectionId: connectionId,
                            // Expire the connection an hour later. This is optional, but recommended.
                            // You will have to decide how often to time out and/or refresh the ttl.
                            ttl: parseInt(String(Date.now() / 1000 + 3600))
                        }
                    })
                        .promise()];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 3: return [4 /*yield*/, dynamodb["delete"]({
                        TableName: connectionTable,
                        Key: { connectionId: connectionId }
                    })
                        .promise()];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 5: return [4 /*yield*/, apig
                        .postToConnection({
                        ConnectionId: connectionId,
                        Data: "Received on routeA: " + body
                    })
                        .promise()];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, apig
                        .postToConnection({
                        ConnectionId: connectionId,
                        Data: "Received on $default: " + body
                    })
                        .promise()];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9: 
                // Return a 200 status to tell API Gateway the message was processed
                // successfully.
                // Otherwise, API Gateway will return a 500 to the client.
                return [2 /*return*/, { statusCode: 200 }];
            }
        });
    });
};
