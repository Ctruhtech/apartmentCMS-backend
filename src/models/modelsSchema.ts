import { z } from 'zod';

const ModelVariant = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  modelUrl: z.string().optional()
});

const TextureVariant = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  textureUrl: z.object({
    diffuseMap: z.string().optional(),
    normalMap: z.string().optional(),
    specularMap: z.string().optional(),
    roughnessMap: z.string().optional(),
    metalnessMap: z.string().optional()
  }),
});

const ColorVariant = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  hexCode: z.string().optional()
});

const Element = z.object({
  id: z.string().optional(),
  meshName: z.string().optional(),
  type: z.string().optional(),
  isModelFlipY: z.boolean().optional(),
  isModelSwap: z.boolean().optional(),
  isTextureSwap: z.boolean().optional(),
  isColorSwap: z.boolean().optional(),
  materialName: z.string().optional(),
  modelLogoUrl: z.string().optional(),
  modelVariants: z.array(ModelVariant).optional(),
  textureVariants: z.array(TextureVariant).optional(),
  colorVariants: z.array(ColorVariant).optional()
});

export { Element, ModelVariant, TextureVariant, ColorVariant };