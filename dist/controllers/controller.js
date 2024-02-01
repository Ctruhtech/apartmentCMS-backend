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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cosmosDB_1 = __importDefault(require("../services/cosmosDB"));
const multer_1 = __importDefault(require("multer"));
const modelsSchema_1 = require("../models/modelsSchema");
const axios_1 = __importDefault(require("axios"));
const identity_1 = require("@azure/identity");
const uuid_1 = require("uuid");
const { Readable } = require('stream');
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const apartmentRouter = express_1.default.Router();
// multer upload middleware
const upload = (0, multer_1.default)();
apartmentRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Apartment backend service is up and running!");
}));
apartmentRouter.get("/models", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const document = yield findAllEntries();
        if (!document) {
            return res.status(404).send("Entry not found in the database");
        }
        return res.status(200).send(document);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
}));
apartmentRouter.get("/models/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const document = yield findEntryById(req.params.id);
        if (!document) {
            return res.status(404).send("Entry not found in the database");
        }
        return res.status(200).send(document);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
}));
apartmentRouter.post("/models", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedEntry = modelsSchema_1.Element.parse(req.body);
        const generatedId = (0, uuid_1.v4)();
        const document = yield createEntry(Object.assign({ id: generatedId }, req.body));
        return res.status(200).send(document);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
}));
apartmentRouter.put("/models/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedEntry = modelsSchema_1.Element.parse(req.body);
        const document = yield updateEntry(req.params.id, req.body);
        return res.status(200).send(document);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
}));
apartmentRouter.delete("/models/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const document = yield deleteEntry(req.params.id);
        return res.status(200).send(document);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
}));
// Function to delete an existing entry from Cosmos DB
function deleteEntry(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id: entryId } = yield findEntryById(id);
        // Delete the entry from the database
        const { resource: deletedEntry } = yield cosmosDB_1.default.item(id, entryId).delete();
        return deletedEntry;
    });
}
// Function to update an existing entry in Cosmos DB
function updateEntry(id, entry) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id: entryId } = entry;
        // Check if an entry with the same id already exists
        const existingEntry = yield findEntryById(id);
        if (!existingEntry) {
            throw new Error("Entry does not exist in the database");
        }
        // Update the entry in the database
        const { resource: updatedEntry } = yield cosmosDB_1.default.item(id, entryId).replace(entry);
        return updatedEntry;
    });
}
// Function to create a new entry in Cosmos DB
function createEntry(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = entry;
        // Check if an entry with the same id already exists
        const existingEntry = yield findEntryById(id);
        if (existingEntry) {
            throw new Error("Entry already exists in the database");
        }
        // Create a new entry in the database
        const { resource: createdEntry } = yield cosmosDB_1.default.items.create(entry);
        return createdEntry;
    });
}
// Function to fetch a single entry from Cosmos DB
function findEntryById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [
                {
                    name: "@id",
                    value: id
                }
            ]
        };
        const { resources: [existingEntry] } = yield cosmosDB_1.default.items.query(querySpec).fetchAll();
        return existingEntry;
    });
}
// Function to fetch all existing entries from Cosmos DB
function findAllEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        const querySpec = {
            query: "SELECT * FROM c"
        };
        const { resources: [existingEntry] } = yield cosmosDB_1.default.items.query(querySpec).fetchAll();
        return existingEntry;
    });
}
// Function to generate CDN purge path from blob URL
const generateCDNPurgePath = (blobUrl) => {
    if (!blobUrl) {
        return null;
    }
    // Parse the BlobFilePath to extract the desired path
    const blobUri = new URL(blobUrl);
    let path = blobUri.pathname;
    // Ensure the path starts with a forward slash '/'
    if (!path.startsWith("/")) {
        path = "/" + path;
    }
    return path; // CDN purge path
};
// CDN multiple purge function
function CDN_Multiple_Purge(blobFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        // CDN purge logic  --------->>>>>>
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecretId = process.env.AZURE_CLIENTSECRET_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID;
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const resourceGroupName = process.env.AZURE_RESOURCEGROUPNAME;
        const profileName = process.env.AZURE_PROFILENAME;
        // Get access token
        const credential = new identity_1.DefaultAzureCredential();
        const accessToken = yield credential.getToken("https://management.azure.com/.default");
        const endpointUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Cdn/profiles/${profileName}/endpoints/${profileName}/purge?api-version=2023-05-01`;
        // Create the requestBody for the CDN purge request
        const requestBody = {
            contentPaths: blobFilePath,
        };
        // Purge the file from CDN
        const response = yield axios_1.default.post(endpointUrl, requestBody, {
            headers: {
                Authorization: `Bearer ${accessToken.token}`
            }
        });
        if (response.status <= 204) {
            return true;
        }
        return false;
    });
}
;
// CDN purge function
function CDN_Purge(blobFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        // CDN purge logic  --------->>>>>>
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecretId = process.env.AZURE_CLIENTSECRET_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID;
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const resourceGroupName = process.env.AZURE_RESOURCEGROUPNAME;
        const profileName = process.env.AZURE_PROFILENAME;
        // Get access token
        const credential = new identity_1.DefaultAzureCredential();
        const accessToken = yield credential.getToken("https://management.azure.com/.default");
        const endpointUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Cdn/profiles/${profileName}/endpoints/${profileName}/purge?api-version=2023-05-01`;
        // Parse the URL to extract the pathname
        const parsedUrl = new URL(blobFilePath);
        const pathWithSlash = parsedUrl.pathname.startsWith("/") ? parsedUrl.pathname : `/${parsedUrl.pathname}`;
        // Create the requestBody for the CDN purge request
        const requestBody = {
            contentPaths: [pathWithSlash],
        };
        // Purge the file from CDN
        const response = yield axios_1.default.post(endpointUrl, requestBody, {
            headers: {
                Authorization: `Bearer ${accessToken.token}`
            }
        });
        if (response.status <= 204) {
            return true;
        }
        return false;
    });
}
;
exports.default = apartmentRouter;
//# sourceMappingURL=controller.js.map