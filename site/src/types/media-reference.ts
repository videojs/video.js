import { z } from 'astro/zod';

export const HostPropertyDefSchema = z.object({
  type: z.string(),
  detailedType: z.string().optional(),
  description: z.string().optional(),
  readonly: z.boolean(),
  overridesNative: z.boolean().optional(),
  default: z.string().optional(),
});

export const MediaEventDefSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const MediaTargetTagSchema = z.enum(['video', 'audio', 'iframe']);

export const EngineOptionDefSchema = z.object({
  name: z.string(),
  type: z.string(),
  detailedType: z.string().optional(),
  description: z.string().optional(),
});

const HtmlMediaReferenceSchema = z.object({
  target: MediaTargetTagSchema,
  attributes: z.object({
    standard: z.array(z.string()),
    custom: z.record(z.string(), HostPropertyDefSchema),
  }),
  properties: z.object({
    definitions: z.record(z.string(), HostPropertyDefSchema),
    native: z.array(z.string()),
  }),
  events: z.object({
    standard: z.array(z.string()),
    custom: z.array(MediaEventDefSchema),
  }),
  methods: z.array(z.string()),
  cssCustomProperties: z.record(z.string(), z.object({ description: z.string() })),
});

const ReactMediaReferenceSchema = z.object({
  target: MediaTargetTagSchema,
  acceptsNativeProps: z.boolean(),
  props: z.record(z.string(), HostPropertyDefSchema),
  /** What `mediaRef` receives, and the module that exports that type when it is not a DOM global. */
  mediaRef: z.object({ type: z.string(), module: z.string().optional() }).optional(),
});

export const MediaReferenceSchema = z.object({
  name: z.string(),
  tagName: z.string(),
  mediaType: z.enum(['video', 'audio']),
  /** Options accepted under `source.engine`, keyed by engine name. */
  engineOptions: z.record(z.string(), z.array(EngineOptionDefSchema)).optional(),
  platforms: z.object({
    html: HtmlMediaReferenceSchema,
    react: ReactMediaReferenceSchema.optional(),
  }),
});

export type EngineOptionDef = z.infer<typeof EngineOptionDefSchema>;
export type HostPropertyDef = z.infer<typeof HostPropertyDefSchema>;
export type MediaEventDef = z.infer<typeof MediaEventDefSchema>;
export type MediaTargetTag = z.infer<typeof MediaTargetTagSchema>;
export type MediaReference = z.infer<typeof MediaReferenceSchema>;
export type HtmlMediaReference = MediaReference['platforms']['html'];
export type ReactMediaReference = NonNullable<MediaReference['platforms']['react']>;
