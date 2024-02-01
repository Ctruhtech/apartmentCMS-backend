import {BlobServiceClient} from '@azure/storage-blob';

const connectionString = process.env.AZURE_BLOB_CONN_STR;
const containerName = process.env.AZURE_BLOB_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const getContainerClient = (containerName) => {
    return blobServiceClient.getContainerClient(containerName);
};


export default getContainerClient;