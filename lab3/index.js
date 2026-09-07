import express from 'express';
import bodyParser from 'body-parser';
import { createReadStream } from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import appSrc from './app.js';

const app = appSrc(express, bodyParser, createReadStream, crypto, http);
const port = Number(process.env.PORT || 3183);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
