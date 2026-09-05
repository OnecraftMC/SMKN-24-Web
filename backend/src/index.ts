import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .get('/api/school-profile', async () => {
    return { name: 'SMK Negeri 24 Jakarta' };
  })
  .listen(3000);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);
