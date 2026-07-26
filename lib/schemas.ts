import { z } from 'zod';

/**
 * The data contract between the two Gemma stages.
 *
 * Stage 1 (vision) produces a BoardArtifact. The student edits it. Stage 2 (text)
 * consumes the *edited* artifact and produces a StudyPack whose every derived item
 * cites the region ids it came from.
 */

export const RegionType = z.enum([
  'heading',
  'paragraph',
  'bullet_list',
  'formula',
  'code',
  'pseudocode',
  'flowchart_node',
  'flowchart_edge',
  'table',
  'label',
  'unknown',
]);

export const LanguageTag = z.enum(['bn', 'en', 'mixed', 'symbol']);

export const RegionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  type: RegionType.catch('unknown'),
  transcription: z.string(),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
  uncertainSpans: z.array(z.string()).default([]),
  languageTags: z.array(LanguageTag).default([]),
  // client-owned flags — the model never sets these
  edited: z.boolean().default(false),
  unreadable: z.boolean().default(false),
});

export const CodeBlockSchema = z.object({
  language: z.string().default('text'),
  code: z.string(),
  sourceRegionIds: z.array(z.string()).default([]),
});

export const BoardArtifactSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  title: z.string().default('Untitled board'),
  detectedLanguages: z.array(z.string()).default([]),
  imageQuality: z.enum(['good', 'fair', 'poor', 'unusable']).catch('fair'),
  regions: z.array(RegionSchema).default([]),
  codeBlocks: z.array(CodeBlockSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

/** `unsupported` is server-added by crossCheckSourceRegions — never model-authored. */
const derived = {
  sourceRegionIds: z.array(z.string()).default([]),
  unsupported: z.boolean().default(false),
};

export const StudyPackSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  notesMarkdown: z.string(),
  keyTerms: z
    .array(z.object({ term: z.string(), bnGloss: z.string().default(''), ...derived }))
    .default([]),
  codeBlocks: z
    .array(z.object({ language: z.string().default('text'), code: z.string(), ...derived }))
    .default([]),
  flashcards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
        supportedByUncertainText: z.boolean().default(false),
        ...derived,
      })
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
});

export type Region = z.infer<typeof RegionSchema>;
export type BoardArtifact = z.infer<typeof BoardArtifactSchema>;
export type StudyPack = z.infer<typeof StudyPackSchema>;

/**
 * JSON Schema sent to the Gemini API as `responseJsonSchema`.
 * Hand-written to mirror the Zod schemas above — the API rejects some constructs a
 * generic Zod->JSONSchema converter emits, and this stays readable for judges.
 */
export const BOARD_ARTIFACT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    detectedLanguages: { type: 'array', items: { type: 'string' } },
    imageQuality: { type: 'string', enum: ['good', 'fair', 'poor', 'unusable'] },
    regions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          order: { type: 'integer' },
          type: { type: 'string', enum: RegionType.options },
          transcription: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          uncertainSpans: { type: 'array', items: { type: 'string' } },
          languageTags: { type: 'array', items: { type: 'string', enum: LanguageTag.options } },
        },
        required: ['id', 'order', 'type', 'transcription', 'confidence'],
      },
    },
    codeBlocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          code: { type: 'string' },
          sourceRegionIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['code'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'detectedLanguages', 'imageQuality', 'regions'],
} as const;

export const STUDY_PACK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    notesMarkdown: { type: 'string' },
    keyTerms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          bnGloss: { type: 'string' },
          sourceRegionIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['term', 'sourceRegionIds'],
      },
    },
    codeBlocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          code: { type: 'string' },
          sourceRegionIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['code', 'sourceRegionIds'],
      },
    },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: { type: 'string' },
          back: { type: 'string' },
          supportedByUncertainText: { type: 'boolean' },
          sourceRegionIds: { type: 'array', items: { type: 'string' } },
        },
        required: ['front', 'back', 'sourceRegionIds'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['notesMarkdown', 'flashcards'],
} as const;
