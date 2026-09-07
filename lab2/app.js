import express from 'express';

export const login = 'nadya0_q';

export function dateParts(now, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(part => [part.type, part.value])
  );

  return {
    route: `/${parts.day}${parts.month}${parts.year.slice(-2)}`,
    date: `${parts.day}-${parts.month}-${parts.year}`
  };
}

export default function createApp({
  now = () => new Date(),
  timeZone = 'Europe/Moscow'
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Author': login,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
      'Access-Control-Allow-Headers': 'x-test,ngrok-skip-browser-warning,Content-Type,Accept,Access-Control-Allow-Headers',
      'Cache-Control': 'no-store'
    });
    next();
  });
  app.use(express.text({ type: () => true, limit: '256kb' }));

  app.all('/result4/', (req, res) => {
    res.json({
      message: login,
      'x-result': req.get('x-test') ?? '',
      'x-body': req.body ?? ''
    });
  });

  app.options(/.*/, (req, res) => {
    res.status(204).end();
  });

  app.get('/', (req, res) => {
    res.type('text/plain').send(login);
  });

  app.get('/login/', (req, res) => {
    res.type('text/plain').send(login);
  });

  app.get(/^\/\d{6}\/?$/, (req, res) => {
    const current = dateParts(now(), timeZone);

    if (req.path.replace(/\/$/, '') !== current.route) {
      return res.status(404).type('text/plain').send('Date not found');
    }

    res.json({ date: current.date, login });
  });

  app.get('/api/rv/:value', (req, res) => {
    if (!/^[a-z]+$/.test(req.params.value)) {
      return res
        .status(400)
        .type('text/plain')
        .send('Expected lowercase Latin letters');
    }

    res.type('text/plain').send([...req.params.value].reverse().join(''));
  });

  app.use((req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const status = error.status === 413 ? 413 : 500;
    const message = error.status === 413 ? 'Request too large' : 'Internal error';
    res.status(status).type('text/plain').send(message);
  });

  return app;
}
