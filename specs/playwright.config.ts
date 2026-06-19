import { config } from 'dotenv'
import { defineConfig } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

config({ path: '../.env' })

const port = process.env.E2E_BASE_PORT || process.env.BE_PORT || '8080'
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const videoMode = process.env.PLAYWRIGHT_VIDEO || 'retain-on-failure'

export default defineConfig({
    fullyParallel: true,
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
    workers: Number(process.env.PW_WORKERS) || 2,
    globalTeardown: './src/coverage/global-teardown.ts',
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: videoMode as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
    },
    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/results.xml' }],
    ],
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                baseURL: `http://localhost:${port}`,
                permissions: ['clipboard-read', 'clipboard-write'],
                ...(chromiumExecutablePath
                    ? { launchOptions: { executablePath: chromiumExecutablePath } }
                    : {}),
            },
        },
    ],
    testDir: defineBddConfig({
        features: 'features',
        steps: ['src/steps/fixture.ts', 'src/steps/index.ts'],
    })
})
