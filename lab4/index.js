import express from 'express';
import https from 'node:https';
import createApp from './app.js';

const app = createApp(express, https);
const port = Number(process.env.PORT || 3184);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
