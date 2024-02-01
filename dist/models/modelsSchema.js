"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Element = void 0;
const zod_1 = require("zod");
const ModelVariant = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    imageUrl: zod_1.z.string(),
    modelUrl: zod_1.z.string().optional()
});
const TextureVariant = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    imageUrl: zod_1.z.string(),
    textureUrl: zod_1.z.object({
        diffuseMap: zod_1.z.string(),
        normalMap: zod_1.z.string().optional(),
        specularMap: zod_1.z.string().optional(),
        roughnessMap: zod_1.z.string().optional(),
        metalnessMap: zod_1.z.string().optional()
    }),
});
const ColorVariant = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    hexCode: zod_1.z.string()
});
const Element = zod_1.z.object({
    id: zod_1.z.string(),
    meshName: zod_1.z.string(),
    type: zod_1.z.string(),
    isModelSwap: zod_1.z.boolean(),
    isTextureSwap: zod_1.z.boolean(),
    isColorSwap: zod_1.z.boolean(),
    materialName: zod_1.z.string(),
    modelVariants: zod_1.z.array(ModelVariant).optional(),
    textureVariants: zod_1.z.array(TextureVariant).optional(),
    colorVariants: zod_1.z.array(ColorVariant).optional()
});
exports.Element = Element;
//# sourceMappingURL=modelsSchema.js.map