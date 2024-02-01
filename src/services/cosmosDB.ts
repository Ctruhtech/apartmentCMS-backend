import { CosmosClient } from "@azure/cosmos";
import dotenv from 'dotenv';
dotenv.config();


const connectionEndpoint = process.env.COSMOS_DB_ENDPOINT;
const connectionKey = process.env.COSMOS_DB_KEY;

const options = {
    endpoint: connectionEndpoint,
    key: connectionKey
  };

const client = new CosmosClient(options);
const database = client.database(process.env.COSMOS_DB_DATABASE_NAME);
const container = database.container(process.env.COSMOS_DB_CONTAINER_NAME);


export default container;