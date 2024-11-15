import { test as baseTest, request } from '@playwright/test';
import path from 'path';

export * from '@playwright/test';

const loginUrl =
  process.env['LOGIN_URL'] || 'http://localhost:8002/api/v1/login';

export const test = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [
    async ({ browser }, use) => {
      // Use parallelIndex as a unique identifier for each worker.
      const id = test.info().parallelIndex;
      const fileName = path.resolve(
        test.info().project.outputDir,
        `.auth/${id}.json`,
      );

      // if (fs.existsSync(fileName)) {
      //   // Reuse existing authentication state if any.
      //   await use(fileName);
      //   return;
      // }
      const account = {
        email: 'sokolov.stas@gmail.com',
        password: 'qwerty',
      };

      const context = await request.newContext({ storageState: undefined });

      const result = await context.post(loginUrl, {
        data: account,
      });
      if (result.status() !== 200 || !result.ok) {
        throw await result.json();
      }

      await context.storageState({ path: fileName });
      await context.dispose();
      await use(fileName);
    },
    { scope: 'worker' },
  ],
});
