import type { TestInfo } from '@playwright/test'

// Request header that tells the backend to create/update a question without computing its embedding.
// Embeddings only feed Robin's duplicate detection and are computed by a billable background OpenRouter
// call after each question write, so non-@ai scenarios skip them to spend no tokens on plain setup.
// See WorkspaceQuestionController.SKIP_EMBEDDING_HEADER.
export const SKIP_EMBEDDING_HEADER = 'X-Skip-Embedding'

const AI_TAG = '@ai'

const isAiScenario = (testInfo: TestInfo): boolean => testInfo.tags.includes(AI_TAG)

// Headers for a REST question write: skip embedding unless the scenario actually exercises Robin.
export const skipEmbeddingHeaders = (testInfo: TestInfo): Record<string, string> | undefined =>
    isAiScenario(testInfo) ? undefined : { [SKIP_EMBEDDING_HEADER]: 'true' }

// Headers that skip the embedding even in an @ai scenario. Used to seed a question that is
// invisible to embedding dedup, so only the deterministic exact-text match can catch it.
export const forceSkipEmbeddingHeaders = (): Record<string, string> => ({ [SKIP_EMBEDDING_HEADER]: 'true' })
