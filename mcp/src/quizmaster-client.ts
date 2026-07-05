import type { IdResponse } from '../../shared/types/id-response.ts'
import type { QuestionListItem } from '../../shared/types/question-list-item.ts'
import type { Question, QuestionRequest } from '../../shared/types/question.ts'
import type { QuizListItem } from '../../shared/types/quiz-list-item.ts'
import type { Quiz, QuizRequest } from '../../shared/types/quiz.ts'
import type { QuizStatsResponse } from '../../shared/types/stats.ts'
import type { Workspace, WorkspaceCreateResponse, WorkspaceRequest } from '../../shared/types/workspace.ts'
import type { McpConfig } from './config.ts'

export type QuizmasterErrorCode =
    | 'authentication-required'
    | 'permission-denied'
    | 'rate-limited'
    | 'backend-validation'
    | 'not-found'
    | 'upstream-service'
    | 'backend-timeout'
    | 'backend-unreachable'
    | 'backend-error'

export interface QuizmasterClientErrorDetails {
    readonly status?: number
    readonly path?: string
    readonly baseUrl?: string
    readonly response?: unknown
}

export class QuizmasterClientError extends Error {
    constructor(
        readonly code: QuizmasterErrorCode,
        message: string,
        readonly details: QuizmasterClientErrorDetails = {},
    ) {
        super(message)
        this.name = 'QuizmasterClientError'
    }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type AuthRequirement = 'public' | 'protected'
const SECRET_KEY_PATTERN = /(authorization|token)/i

const parseJsonOrText = (text: string): unknown => {
    if (text.trim() === '') return undefined

    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

const responseMessage = (status: number, response: unknown): string => {
    if (response && typeof response === 'object') {
        const record = response as Record<string, unknown>
        for (const key of ['message', 'detail', 'error', 'title']) {
            const value = record[key]
            if (typeof value === 'string' && value.trim() !== '') return value
        }
    }
    if (typeof response === 'string' && response.trim() !== '') return response
    if (status === 400) return 'Quizmaster rejected the request.'
    if (status === 401) return 'Quizmaster authentication is required or the token is invalid.'
    if (status === 403) return 'Quizmaster permission denied.'
    if (status === 404) return 'Quizmaster resource was not found.'
    if (status === 429) return 'Quizmaster rate limit exceeded.'
    if (status === 502 || status === 503) return 'Quizmaster upstream service failed.'
    return `Quizmaster request failed with HTTP ${status}.`
}

const codeForStatus = (status: number): QuizmasterErrorCode => {
    if (status === 400) return 'backend-validation'
    if (status === 401) return 'authentication-required'
    if (status === 403) return 'permission-denied'
    if (status === 404) return 'not-found'
    if (status === 429) return 'rate-limited'
    if (status === 502 || status === 503) return 'upstream-service'
    return 'backend-error'
}

const pathSegment = (value: string | number): string => encodeURIComponent(value)

const workspacePath = (workspaceGuid: string, suffix = ''): string =>
    `/api/workspaces/${pathSegment(workspaceGuid)}${suffix}`

export class QuizmasterClient {
    private readonly fetcher: typeof fetch

    constructor(
        private readonly config: McpConfig,
        fetcher: typeof fetch = fetch,
    ) {
        this.fetcher = fetcher
    }

    get baseUrl(): string {
        return this.config.baseUrl
    }

    async health(): Promise<{ readonly baseUrl: string; readonly reachable: boolean }> {
        try {
            await this.request<unknown>('GET', '/api/feature-flag', undefined, 'public')
            return { baseUrl: this.baseUrl, reachable: true }
        } catch (error) {
            if (error instanceof QuizmasterClientError && error.code === 'not-found') {
                try {
                    await this.request<unknown>('GET', '/', undefined, 'public')
                    return { baseUrl: this.baseUrl, reachable: true }
                } catch {
                    return { baseUrl: this.baseUrl, reachable: false }
                }
            }
            return { baseUrl: this.baseUrl, reachable: false }
        }
    }

    async createWorkspace(request: WorkspaceRequest): Promise<WorkspaceCreateResponse> {
        return await this.request('POST', '/api/workspaces', request)
    }

    async getWorkspace(workspaceGuid: string): Promise<Workspace> {
        return await this.request('GET', workspacePath(workspaceGuid))
    }

    async listQuestions(workspaceGuid: string): Promise<readonly QuestionListItem[]> {
        return await this.request('GET', workspacePath(workspaceGuid, '/questions'))
    }

    async getQuestion(workspaceGuid: string, questionId: number): Promise<Question> {
        return await this.request('GET', workspacePath(workspaceGuid, `/questions/${pathSegment(questionId)}`))
    }

    async createQuestion(workspaceGuid: string, question: QuestionRequest): Promise<IdResponse> {
        return await this.request('POST', workspacePath(workspaceGuid, '/questions'), question)
    }

    async updateQuestion(workspaceGuid: string, questionId: number, question: QuestionRequest): Promise<IdResponse> {
        return await this.request(
            'PATCH',
            workspacePath(workspaceGuid, `/questions/${pathSegment(questionId)}`),
            question,
        )
    }

    async deleteQuestion(workspaceGuid: string, questionId: number): Promise<void> {
        await this.request('DELETE', workspacePath(workspaceGuid, `/questions/${pathSegment(questionId)}`))
    }

    async listQuizzes(workspaceGuid: string): Promise<readonly QuizListItem[]> {
        return await this.request('GET', workspacePath(workspaceGuid, '/quizzes'))
    }

    async getQuiz(workspaceGuid: string, quizId: number): Promise<Quiz> {
        return await this.request('GET', workspacePath(workspaceGuid, `/quizzes/${pathSegment(quizId)}`))
    }

    async createQuiz(workspaceGuid: string, quiz: QuizRequest): Promise<IdResponse> {
        return await this.request('POST', workspacePath(workspaceGuid, '/quizzes'), quiz)
    }

    async updateQuiz(workspaceGuid: string, quizId: number, quiz: QuizRequest): Promise<IdResponse> {
        return await this.request('PUT', workspacePath(workspaceGuid, `/quizzes/${pathSegment(quizId)}`), quiz)
    }

    async deleteQuiz(workspaceGuid: string, quizId: number): Promise<void> {
        await this.request('DELETE', workspacePath(workspaceGuid, `/quizzes/${pathSegment(quizId)}`))
    }

    async getQuizStats(workspaceGuid: string, quizId: number): Promise<QuizStatsResponse> {
        return await this.request('GET', workspacePath(workspaceGuid, `/quizzes/${pathSegment(quizId)}/stats`))
    }

    private authHeaders(path: string, authRequirement: AuthRequirement): Record<string, string> {
        if (authRequirement === 'public' || this.config.authMode === 'none') return {}

        if (!this.config.authToken) {
            throw new QuizmasterClientError(
                'authentication-required',
                'QUIZMASTER_AUTH_TOKEN is required for protected Quizmaster REST calls.',
                { path },
            )
        }

        return { Authorization: `Bearer ${this.config.authToken}` }
    }

    private redactSecretText(value: string): string {
        return this.config.authToken ? value.replaceAll(this.config.authToken, '[redacted]') : value
    }

    private redactSecrets(value: unknown): unknown {
        if (typeof value === 'string') return this.redactSecretText(value)
        if (Array.isArray(value)) return value.map(item => this.redactSecrets(item))
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, entry]) => [
                    key,
                    SECRET_KEY_PATTERN.test(key) ? '[redacted]' : this.redactSecrets(entry),
                ]),
            )
        }
        return value
    }

    private async request<T>(
        method: HttpMethod,
        path: string,
        body?: unknown,
        authRequirement: AuthRequirement = 'protected',
    ): Promise<T> {
        const url = new URL(path, this.baseUrl).toString()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)

        try {
            const authHeaders = this.authHeaders(path, authRequirement)
            const response = await this.fetcher(url, {
                method,
                headers: {
                    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
                    ...authHeaders,
                },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            })
            const text = await response.text()
            const parsed = parseJsonOrText(text)

            if (!response.ok) {
                const redactedResponse = this.redactSecrets(parsed)
                throw new QuizmasterClientError(
                    codeForStatus(response.status),
                    this.redactSecretText(responseMessage(response.status, redactedResponse)),
                    {
                        status: response.status,
                        path,
                        response: redactedResponse,
                    },
                )
            }

            return parsed as T
        } catch (error) {
            if (error instanceof QuizmasterClientError) throw error
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new QuizmasterClientError(
                    'backend-timeout',
                    `Quizmaster backend timed out after ${this.config.requestTimeoutMs}ms.`,
                    { baseUrl: this.baseUrl, path },
                )
            }
            throw new QuizmasterClientError(
                'backend-unreachable',
                `Quizmaster backend is unreachable at ${this.baseUrl}.`,
                {
                    baseUrl: this.baseUrl,
                    path,
                },
            )
        } finally {
            clearTimeout(timeout)
        }
    }
}
