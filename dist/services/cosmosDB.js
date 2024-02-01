"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cosmos_1 = require("@azure/cosmos");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionEndpoint = process.env.COSMOS_DB_ENDPOINT;
const connectionKey = process.env.COSMOS_DB_KEY;
const options = {
    endpoint: connectionEndpoint,
    key: connectionKey
};
const client = new cosmos_1.CosmosClient(options);
const database = client.database(process.env.COSMOS_DB_DATABASE_NAME);
const container = database.container(process.env.COSMOS_DB_CONTAINER_NAME);
exports.default = container;
//# sourceMappingURL=cosmosDB.js.map