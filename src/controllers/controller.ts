import express, { json, response } from "express";
import { Request, Response } from "express";
import container from "../services/cosmosDB";
import multer, {Multer} from "multer";
import getContainerClient from "../services/blobStorage";
import { Element, ModelVariant, TextureVariant, ColorVariant } from "../models/modelsSchema";
import { ZodError } from "zod";
import axios from "axios";
import { DefaultAzureCredential } from "@azure/identity";
import path from "path";
import { generateBlobSASQueryParameters, ContainerSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuid } from "uuid";

const { Readable } = require('stream');


import dotenv from "dotenv";
dotenv.config();


const apartmentRouter = express.Router();

// multer upload middleware
const upload = multer();

// multer request interface to allow file type
interface MulterRequest extends Request {
    files: {
        [fieldname: string]: Express.Multer.File[];
    };
}

apartmentRouter.get("/", async(req: Request, res: Response) => {
  res.send("Apartment backend service is up and running!");
});

apartmentRouter.post('/login', (req, res) => {
    const { username, password } = req.body;

    const hardcodedPassword = process.env.CMS_PASSWORD;
    const hardcodedUsername = process.env.CMS_USERNAME;
  
    if (username === hardcodedUsername && password === hardcodedPassword) {
      return res.status(200).send('Authentication successful');
    }
  
    return res.status(401).send('Authentication failed');
});

apartmentRouter.get("/models", async(req: Request, res: Response) => {
    try {
        const document = await findAllEntries();

	    if (!Array.isArray(document) || document.length === 0) {
            return res.status(404).send("No entries found in the database");
        }

        const filteredResponse = document.map((item) => {
            return {
              id: item.id,
              meshName: item.meshName,
              type: item.type,
              isModelSwap: item.isModelSwap,
              isTextureSwap: item.isTextureSwap,
              isColorSwap: item.isColorSwap,
              materialName: item.materialName,
              modelVariants: item.modelVariants,
              textureVariants: item.textureVariants,
              colorVariants: item.colorVariants,
            };
          });

        return res.status(200).send(filteredResponse);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

apartmentRouter.get("/models/:id", async(req: Request, res: Response) => {
    try {
        const document = await findEntryById(req.params.id);

        if (!document){
            return res.status(404).send("Entry not found in the database");
        }

        const filteredResponse = {
            id: document.id,
            meshName: document.meshName,
            type: document.type,
            isModelSwap: document.isModelSwap,
            isTextureSwap: document.isTextureSwap,
            isColorSwap: document.isColorSwap,
            materialName: document.materialName,
            modelVariants: document.modelVariants,
            textureVariants: document.textureVariants,
            colorVariants: document.colorVariants,
        };

        return res.status(200).send(filteredResponse);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

apartmentRouter.get("/models/filter/:meshName", async(req: Request, res: Response) => {
    try {
        const filteredEntries = await filterEntries(req.params.meshName);

        if (!Array.isArray(filteredEntries)) {
            return res.status(404).send("No entries found in the database");
        }

        const filteredResponse = filteredEntries.map((item) => {
            return {
              id: item.id,
              meshName: item.meshName,
              type: item.type,
              isModelSwap: item.isModelSwap,
              isTextureSwap: item.isTextureSwap,
              isColorSwap: item.isColorSwap,
              materialName: item.materialName,
              modelVariants: item.modelVariants,
              textureVariants: item.textureVariants,
              colorVariants: item.colorVariants
            };
          });

        return res.status(200).send(filteredResponse);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// post request to upload a model
apartmentRouter.post("/models", async(req: Request, res: Response) => {
    try {
        const validatedEntry = Element.parse(req.body);
        const generatedId = uuid();

        const document = {
            id: generatedId,
            ...req.body
        };

        await createEntry(document);

        const filteredResponse = {
            id: document.id,
            meshName: document.meshName,
            type: document.type,
            isModelSwap: document.isModelSwap,
            isTextureSwap: document.isTextureSwap,
            isColorSwap: document.isColorSwap,
            materialName: document.materialName,
            modelVariants: document.modelVariants,
            textureVariants: document.textureVariants,
            colorVariants: document.colorVariants,
          };

        return res.status(200).send(filteredResponse);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// Add a ModelVariant to an Element
apartmentRouter.post("/models/:id/model", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const newModel = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }

      // Validate the new ModelVariant using Zod schema
      const validatedModel = ModelVariant.safeParse(newModel);

      if (!validatedModel.success) {
        return res.status(400).send("Invalid ModelVariant data");
      }

      const newModelVariant = {
        id: validatedModel.data.id,
        name: validatedModel.data.name,
        imageUrl: validatedModel.data.imageUrl,
        modelUrl: validatedModel.data.modelUrl,
      };
  
      // Add the new ModelVariant to the Element
      existingEntry.modelVariants.push(newModelVariant);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

// specific addition of texture variant
apartmentRouter.post("/models/:id/texture", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const newTexture = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }

      // Validate the new TextureVariant using Zod schema
      const validatedTexture = TextureVariant.safeParse(newTexture);

      if (!validatedTexture.success) {
        return res.status(400).send("Invalid TextureVariant data");
      }

      const newTextureVariant = {
        id: validatedTexture.data.id,
        name: validatedTexture.data.name,
        imageUrl: validatedTexture.data.imageUrl,
        textureUrl: validatedTexture.data.textureUrl,
      };
  
      // Add the new TextureVariant to the Element
      existingEntry.textureVariants.push(newTextureVariant);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

// specific addition of color variant
apartmentRouter.post("/models/:id/color", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const newColor = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }

      // Validate the new ColorVariant using Zod schema
      const validatedColor = ColorVariant.safeParse(newColor);

      if (!validatedColor.success) {
        return res.status(400).send("Invalid ColorVariant data");
      }

      const newColorVariant = {
        id: validatedColor.data.id,
        name: validatedColor.data.name,
        hexCode: validatedColor.data.hexCode,
      };
  
      // Add the new ColorVariant to the Element
      existingEntry.colorVariants.push(newColorVariant);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

  
// update whole structure 
apartmentRouter.put("/models/:id", async(req: Request, res: Response) => {
    try {
        const validatedEntry = Element.parse(req.body);

        const document = req.body;

        await updateEntry(req.params.id, req.body);

        const filteredResponse = {
            id: document.id,
            meshName: document.meshName,
            type: document.type,
            isModelSwap: document.isModelSwap,
            isTextureSwap: document.isTextureSwap,
            isColorSwap: document.isColorSwap,
            materialName: document.materialName,
            modelVariants: document.modelVariants,
            textureVariants: document.textureVariants,
            colorVariants: document.colorVariants,
          };

        return res.status(200).send(filteredResponse);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// Update a specific ModelVariant within an Element
apartmentRouter.put("/models/:id/model/:modelId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const modelId = req.params.modelId;
      const updatedModel = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the modelVariant to update
      const modelIndex = existingEntry.modelVariants.findIndex((model) => model.id === modelId);
  
      if (modelIndex === -1) {
        return res.status(404).send("ModelVariant not found in the Element");
      }
  
      // Update the specific ModelVariant in the Element
      existingEntry.modelVariants[modelIndex] = updatedModel;
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

// Update a specific TextureVariant within an Element
apartmentRouter.put("/models/:id/texture/:textureId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const textureId = req.params.textureId;
      const updatedTexture = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the textureVariant to update
      const textureIndex = existingEntry.textureVariants.findIndex((texture) => texture.id === textureId);
  
      if (textureIndex === -1) {
        return res.status(404).send("TextureVariant not found in the Element");
      }
  
      // Update the specific TextureVariant in the Element
      existingEntry.textureVariants[textureIndex] = updatedTexture;
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});
  
// Update a specific ColorVariant within an Element
apartmentRouter.put("/models/:id/color/:colorId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const colorId = req.params.colorId;
      const updatedColor = req.body;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the colorVariant to update
      const colorIndex = existingEntry.colorVariants.findIndex((color) => color.id === colorId);
  
      if (colorIndex === -1) {
        return res.status(404).send("ColorVariant not found in the Element");
      }
  
      // Update the specific ColorVariant in the Element
      existingEntry.colorVariants[colorIndex] = updatedColor;
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

apartmentRouter.delete("/models/:id", async(req: Request, res: Response) => {
    try {
        const document = await deleteEntry(req.params.id);

        return res.status(200).send(document);
    }
    catch(err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// specific deletion of model variant
apartmentRouter.delete("/models/:id/model/:modelId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const modelId = req.params.modelId;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the ModelVariant to delete
      const modelIndex = existingEntry.modelVariants.findIndex((model) => model.id === modelId);
  
      if (modelIndex === -1) {
        return res.status(404).send("ModelVariant not found in the Element");
      }
  
      // Remove the ModelVariant from the Element
      existingEntry.modelVariants.splice(modelIndex, 1);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

// specific deletion of texture variant
apartmentRouter.delete("/models/:id/texture/:textureId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const textureId = req.params.textureId;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the TextureVariant to delete
      const textureIndex = existingEntry.textureVariants.findIndex((texture) => texture.id === textureId);
  
      if (textureIndex === -1) {
        return res.status(404).send("TextureVariant not found in the Element");
      }
  
      // Remove the TextureVariant from the Element
      existingEntry.textureVariants.splice(textureIndex, 1);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

// specific deletion of color variant
apartmentRouter.delete("/models/:id/color/:colorId", async (req: Request, res: Response) => {
    try {
      const entryId = req.params.id;
      const colorId = req.params.colorId;
  
      // Check if an entry with the same id already exists
      const existingEntry = await findEntryById(entryId);
  
      if (!existingEntry) {
        return res.status(404).send("Entry not found in the database");
      }
  
      // Find the index of the ColorVariant to delete
      const colorIndex = existingEntry.colorVariants.findIndex((color) => color.id === colorId);
  
      if (colorIndex === -1) {
        return res.status(404).send("ColorVariant not found in the Element");
      }
  
      // Remove the ColorVariant from the Element
      existingEntry.colorVariants.splice(colorIndex, 1);
  
      // Update the Element in the database
      const updatedEntry = await updateEntry(entryId, existingEntry);
  
      return res.status(200).json(updatedEntry);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});





// Function to filter the entries based on the meshName
async function filterEntries(meshName: string) {
    const querySpec = {
        query: "SELECT * FROM c"
    }

    const { resources } = await container.items.query(querySpec).fetchAll();

    meshName = meshName.toLowerCase();

    const filteredEntries = resources.filter((entry) => entry.meshName.includes(meshName));

    return filteredEntries;
}

// Function to delete an existing entry from Cosmos DB
async function deleteEntry(id: string) {
    const { id: entryId } = await findEntryById(id);

    // Delete the entry from the database
    const { resource: deletedEntry } = await container.item(id, entryId).delete();

    return deletedEntry;
}

// Function to update an existing entry in Cosmos DB
async function updateEntry(id: string, entry: Element) {
    const { id: entryId } = entry;

    // Check if an entry with the same id already exists
    const existingEntry = await findEntryById(id);

    if (!existingEntry) {
        throw new Error("Entry does not exist in the database");
    }

    // Update the entry in the database
    const { resource: updatedEntry } = await container.item(id, entryId).replace(entry);

    return updatedEntry;
}

// Function to create a new entry in Cosmos DB
async function createEntry(entry: Element) {
    const { id } = entry;

    // Check if an entry with the same id already exists
    const existingEntry = await findEntryById(id);

    if (existingEntry) {
        throw new Error("Entry already exists in the database");
    }

    // Create a new entry in the database
    const { resource: createdEntry } = await container.items.create(entry);

    return createdEntry;
}

// Function to fetch a single entry from Cosmos DB
async function findEntryById(id: string) {
    const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [
            {
                name: "@id",
                value: id
            }
        ]
    };

    const { resources: [existingEntry] } = await container.items.query(querySpec).fetchAll();

    return existingEntry;
}

// Function to fetch all existing entries from Cosmos DB
async function findAllEntries() {   
    const querySpec = {
        query: "SELECT * FROM c"
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    return resources;
}

// Function to generate CDN purge path from blob URL
const generateCDNPurgePath = (blobUrl: string) => {
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
async function CDN_Multiple_Purge(blobFilePath: string[]){

	// CDN purge logic  --------->>>>>>
	const clientId = process.env.AZURE_CLIENT_ID;
	const clientSecretId = process.env.AZURE_CLIENTSECRET_ID;
	const clientSecret = process.env.AZURE_CLIENT_SECRET;
	const tenantId = process.env.AZURE_TENANT_ID;
	const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroupName = process.env.AZURE_RESOURCEGROUPNAME;
	const profileName = process.env.AZURE_PROFILENAME;

	// Get access token
	const credential = new DefaultAzureCredential();
	const accessToken = await credential.getToken("https://management.azure.com/.default");

	const endpointUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Cdn/profiles/${profileName}/endpoints/${profileName}/purge?api-version=2023-05-01`;

	// Create the requestBody for the CDN purge request
	const requestBody = {
		  contentPaths: blobFilePath,
	};

	// Purge the file from CDN
	const response = await axios.post(endpointUrl, requestBody, {
		headers: {
			Authorization: `Bearer ${accessToken.token}`
		}
	});

	if (response.status <= 204){
		return true;
	}

	return false;
};


// CDN purge function
async function CDN_Purge(blobFilePath: string){

	// CDN purge logic  --------->>>>>>
	const clientId = process.env.AZURE_CLIENT_ID;
	const clientSecretId = process.env.AZURE_CLIENTSECRET_ID;
	const clientSecret = process.env.AZURE_CLIENT_SECRET;
	const tenantId = process.env.AZURE_TENANT_ID;
	const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroupName = process.env.AZURE_RESOURCEGROUPNAME;
	const profileName = process.env.AZURE_PROFILENAME;

	// Get access token
	const credential = new DefaultAzureCredential();

	const accessToken = await credential.getToken("https://management.azure.com/.default");

	const endpointUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Cdn/profiles/${profileName}/endpoints/${profileName}/purge?api-version=2023-05-01`;

	// Parse the URL to extract the pathname
	const parsedUrl = new URL(blobFilePath);
	const pathWithSlash = parsedUrl.pathname.startsWith("/") ? parsedUrl.pathname : `/${parsedUrl.pathname}`;

	// Create the requestBody for the CDN purge request
	const requestBody = {
		  contentPaths: [pathWithSlash],
	};

	// Purge the file from CDN
	const response = await axios.post(endpointUrl, requestBody, {
		headers: {
			Authorization: `Bearer ${accessToken.token}`
		}
	});

	if (response.status <= 204){
		return true;
	}

	return false;
};




export default apartmentRouter;