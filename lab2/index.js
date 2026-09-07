import createApp from './app.js';

const port = Number(process.env.PORT || 3182);
const host = process.env.HOST || '127.0.0.1';
const timeZone = process.env.LAB_TIMEZONE || 'Europe/Moscow';
const server = createApp({ timeZone }).listen(port, host);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
