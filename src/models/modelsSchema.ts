import { z } from 'zod';

const ModelVariant = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  modelUrl: z.string().optional()
});

const TextureVariant = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  textureUrl: z.object({
    diffuseMap: z.string(),
    normalMap: z.string().optional(),
    specularMap: z.string().optional(),
    roughnessMap: z.string().optional(),
    metalnessMap: z.string().optional()
  }),
});

const ColorVariant = z.object({
  id: z.string(),
  name: z.string(),
  hexCode: z.string()
});

const Element = z.object({
  id: z.string(),
  meshName: z.string(),
  type: z.string(),
  isModelSwap: z.boolean(),
  isTextureSwap: z.boolean(),
  isColorSwap: z.boolean(),
  materialName: z.string(),
  modelVariants: z.array(ModelVariant).optional(),
  textureVariants: z.array(TextureVariant).optional(),
  colorVariants: z.array(ColorVariant).optional()
});

export { Element };

