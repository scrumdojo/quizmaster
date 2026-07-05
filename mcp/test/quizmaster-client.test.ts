import { describe, expect, it } from 'vitest'

import type { McpConfig } from '../src/config.ts'
import { QuizmasterClient, QuizmasterClientError } from '../src/quizmaster-client.ts'

const testConfig = (overrides: Partial<McpConfig> = {}): McpConfig => ({
    baseUrl: 'http://quizmaster.test',
    transport: 'stdio',
    logLevel: 'error',
    requestTimeoutMs: 50,
    authMode: 'bearer',
    authToken: 'test-token',
    ...overrides,
})

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

describe('QuizmasterClient', () => {
    it('constructs encoded REST URLs and JSON request bodies', async () => {
        let capturedUrl = ''
        let capturedBody: unknown
        let capturedHeaders = new Headers()
        const fetcher: typeof fetch = async (input, init) => {
            capturedUrl = String(input)
            capturedBody = JSON.parse(String(init?.body))
            capturedHeaders = new Headers(init?.headers)
            return jsonResponse({ id: 42 })
        }

        const client = new QuizmasterClient(testConfig(), fetcher)
        await client.createQuestion('workspace guid', {
            question: 'Question?',
            answers: ['A', 'B'],
            correctAnswers: [0],
            explanations: ['Yes', 'No'],
            questionExplanation: '',
            questionType: 'single',
            isEasy: false,
            tags: [],
        })

        expect(capturedUrl).toBe('http://quizmaster.test/api/workspaces/workspace%20guid/questions')
        expect(capturedBody).toMatchObject({ question: 'Question?', questionType: 'single' })
        expect(capturedHeaders.get('authorization')).toBe('Bearer test-token')
        expect(capturedHeaders.get('content-type')).toBe('application/json')
        expect(capturedHeaders.has('x-workspace-key')).toBe(false)
    })

    it('fails protected calls before REST when bearer auth has no token', async () => {
        let called = false
        const fetcher: typeof fetch = async () => {
            called = true
            return jsonResponse({})
        }
        const client = new QuizmasterClient(testConfig({ authToken: undefined }), fetcher)

        await expect(client.getWorkspace('demo')).rejects.toMatchObject({
            code: 'authentication-required',
            message: 'QUIZMASTER_AUTH_TOKEN is required for protected Quizmaster REST calls.',
            details: {
                path: '/api/workspaces/demo',
            },
        })
        expect(called).toBe(false)
    })

    it('allows legacy local auth mode without an authorization header', async () => {
        let capturedHeaders = new Headers()
        const fetcher: typeof fetch = async (_input, init) => {
            capturedHeaders = new Headers(init?.headers)
            return jsonResponse({ guid: 'demo', title: 'Demo' })
        }
        const client = new QuizmasterClient(testConfig({ authMode: 'none', authToken: undefined }), fetcher)

        await client.getWorkspace('demo')

        expect(capturedHeaders.has('authorization')).toBe(false)
    })

    it('maps REST not-found responses into typed client errors', async () => {
        const fetcher: typeof fetch = async () => jsonResponse({ message: 'Missing workspace.' }, 404)
        const client = new QuizmasterClient(testConfig(), fetcher)

        await expect(client.getWorkspace('missing')).rejects.toMatchObject({
            code: 'not-found',
            message: 'Missing workspace.',
            details: {
                status: 404,
                path: '/api/workspaces/missing',
            },
        })
    })

    it.each([
        [401, 'authentication-required'],
        [403, 'permission-denied'],
        [429, 'rate-limited'],
    ] as const)('maps REST %i responses into auth-aware client errors', async (status, code) => {
        const fetcher: typeof fetch = async () => jsonResponse({}, status)
        const client = new QuizmasterClient(testConfig(), fetcher)

        await expect(client.getWorkspace('demo')).rejects.toMatchObject({
            code,
            details: {
                status,
                path: '/api/workspaces/demo',
            },
        })
    })

    it('redacts configured token values from REST error messages and details', async () => {
        const fetcher: typeof fetch = async () =>
            jsonResponse(
                {
                    message: 'Bad token test-token.',
                    token: 'test-token',
                    nested: {
                        Authorization: 'Bearer test-token',
                    },
                },
                401,
            )
        const client = new QuizmasterClient(testConfig(), fetcher)

        await expect(client.getWorkspace('demo')).rejects.toMatchObject({
            code: 'authentication-required',
            message: 'Bad token [redacted].',
            details: {
                response: {
                    message: 'Bad token [redacted].',
                    token: '[redacted]',
                    nested: {
                        Authorization: '[redacted]',
                    },
                },
            },
        })
    })

    it('maps aborts into backend-timeout errors', async () => {
        const fetcher: typeof fetch = async (_input, init) =>
            await new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
            })
        const client = new QuizmasterClient(testConfig({ requestTimeoutMs: 1 }), fetcher)

        await expect(client.getWorkspace('slow')).rejects.toBeInstanceOf(QuizmasterClientError)
        await expect(client.getWorkspace('slow')).rejects.toMatchObject({ code: 'backend-timeout' })
    })
})
