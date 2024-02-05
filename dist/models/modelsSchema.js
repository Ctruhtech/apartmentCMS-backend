"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorVariant = exports.TextureVariant = exports.ModelVariant = exports.Element = void 0;
const zod_1 = require("zod");
const ModelVariant = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    modelUrl: zod_1.z.string().optional()
});
exports.ModelVariant = ModelVariant;
const TextureVariant = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    textureUrl: zod_1.z.object({
        diffuseMap: zod_1.z.string().optional(),
        normalMap: zod_1.z.string().optional(),
        specularMap: zod_1.z.string().optional(),
        roughnessMap: zod_1.z.string().optional(),
        metalnessMap: zod_1.z.string().optional()
    }),
});
exports.TextureVariant = TextureVariant;
const ColorVariant = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    hexCode: zod_1.z.string().optional()
});
exports.ColorVariant = ColorVariant;
const Element = zod_1.z.object({
    id: zod_1.z.string().optional(),
    meshName: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    isModelFlipY: zod_1.z.boolean().optional(),
    isModelSwap: zod_1.z.boolean().optional(),
    isTextureSwap: zod_1.z.boolean().optional(),
    isColorSwap: zod_1.z.boolean().optional(),
    materialName: zod_1.z.string().optional(),
    modelLogoUrl: zod_1.z.string().optional(),
    modelVariants: zod_1.z.array(ModelVariant).optional(),
    textureVariants: zod_1.z.array(TextureVariant).optional(),
    colorVariants: zod_1.z.array(ColorVariant).optional()
});
exports.Element = Element;
//# sourceMappingURL=modelsSchema.js.map