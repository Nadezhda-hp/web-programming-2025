const LOGIN = 'nadya0_q';

export default function createApp(express, https) {
  const app = express();

  app.disable('x-powered-by');

  app.get('/login', (req, res) => {
    res.type('text/plain').send(LOGIN);
  });

  app.get('/id/:id', (req, res) => {
    const options = {
      protocol: 'https:',
      hostname: 'nd.kodaktor.ru',
      port: 443,
      path: `/users/${encodeURIComponent(req.params.id)}`,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    };

    const request = https.request(options, response => {
      const chunks = [];
      let size = 0;

      response.on('data', chunk => {
        size += chunk.length;

        if (size > 1024 * 1024) {
          request.destroy();

          if (!res.headersSent) {
            res.status(502).type('text/plain').send('Response is too large');
          }
        } else {
          chunks.push(Buffer.from(chunk));
        }
      });

      response.on('end', () => {
        if (res.headersSent) {
          return;
        }

        if (response.statusCode !== 200) {
          res.status(502).type('text/plain').send('User request failed');
          return;
        }

        try {
          const user = JSON.parse(Buffer.concat(chunks).toString('utf8'));

          if (typeof user.login !== 'string') {
            res.status(404).type('text/plain').send('Login not found');
            return;
          }

          res.type('text/plain').send(user.login);
        } catch {
          res.status(502).type('text/plain').send('Invalid response');
        }
      });

      response.on('error', () => {
        if (!res.headersSent) {
          res.status(502).type('text/plain').send('User request failed');
        }
      });
    });

    request.setTimeout(8000, () => request.destroy(new Error('Request timeout')));
    request.on('error', () => {
      if (!res.headersSent) {
        res.status(502).type('text/plain').send('User request failed');
      }
    });
    request.end();
  });

  app.use((req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });

  return app;
}
