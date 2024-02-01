"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_BLOB_CONN_STR;
const containerName = process.env.AZURE_BLOB_NAME;
const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
const getContainerClient = (containerName) => {
    return blobServiceClient.getContainerClient(containerName);
};
exports.default = getContainerClient;
//# sourceMappingURL=blobStorage.js.map