export default function appSrc(express, bodyParser, createReadStream, crypto, http) {
  const app = express();
  const login = 'nadya0_q';
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,ngrok-skip-browser-warning',
      'Cache-Control': 'no-store'
    });
    next();
  });
  app.use(bodyParser.urlencoded({ extended: false, limit: '64kb' }));
  app.use(bodyParser.json({ limit: '64kb' }));

  app.get('/login/', (req, res) => {
    res.type('text/plain').send(login);
  });

  app.get('/code/', (req, res) => {
    res.type('text/plain');
    const source = createReadStream(new URL(import.meta.url));

    source.on('error', () => {
      if (!res.headersSent) {
        res.status(500).send('Source unavailable');
      } else {
        res.destroy();
      }
    });

    source.pipe(res);
  });

  app.get('/sha1/:input/', (req, res) => {
    const hash = crypto
      .createHash('sha1')
      .update(req.params.input)
      .digest('hex');

    res.type('text/plain').send(hash);
  });

  const allowedAddress = value => {
    const ip = value.toLowerCase().replace(/^\[|\]$/g, '');

    if (ip.includes(':')) {
      return false;
    }

    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return false;
    }

    const [a, b, c] = ip.split('.').map(Number);
    const blocked =
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113);

    return !blocked;
  };

  const requestResource = (req, res) => {
    const addr = req.method === 'POST'
      ? (req.body?.addr ?? req.query.addr)
      : req.query.addr;

    if (typeof addr !== 'string') {
      return res.status(400).type('text/plain').send('addr is required');
    }

    let target;

    try {
      target = new URL(addr);
    } catch {
      return res.status(400).type('text/plain').send('Invalid URL');
    }

    const unsupportedTarget =
      target.protocol !== 'http:' ||
      target.username ||
      target.password ||
      (target.port && target.port !== '80');

    if (unsupportedTarget) {
      return res.status(400).type('text/plain').send('Expected a public HTTP URL on port 80');
    }

    const host = target.hostname.toLowerCase();
    const blockedHost =
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.includes(':') ||
      (/^[\d.]+$/.test(host) && !allowedAddress(host));

    if (blockedHost) {
      return res.status(403).type('text/plain').send('Address not allowed');
    }

    let upstream;

    const fail = (status, message) => {
      if (!res.headersSent && !res.destroyed) {
        res.status(status).type('text/plain').send(message);
      }

      upstream?.destroy();
    };

    try {
      upstream = http.get(target, { family: 4, agent: false }, response => {
        const chunks = [];
        let size = 0;

        response.on('data', chunk => {
          size += chunk.length;

          if (size > 1048576) {
            response.destroy();
            fail(502, 'Resource too large');
          } else {
            chunks.push(Buffer.from(chunk));
          }
        });

        response.on('error', () => fail(502, 'Resource unavailable'));
        response.on('aborted', () => fail(502, 'Resource interrupted'));
        response.on('end', () => {
          if (!res.headersSent && !res.destroyed) {
            const body = Buffer.concat(chunks).toString('utf8');
            res.type('text/plain').send(body);
          }
        });
      });

      upstream.on('socket', socket => {
        socket.on('lookup', (error, address) => {
          if (!error && !allowedAddress(address)) {
            fail(403, 'Address not allowed');
          }
        });
      });

      upstream.setTimeout(8000, () => fail(504, 'Resource timeout'));
      upstream.on('error', () => fail(502, 'Resource unavailable'));
      res.on('close', () => upstream.destroy());
    } catch {
      fail(502, 'Resource unavailable');
    }
  };

  app.get('/req/', requestResource);
  app.post('/req/', requestResource);

  app.all(/.*/, (req, res) => {
    res.type('text/plain').send(login);
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    res.status(error.status === 413 ? 413 : 400).type('text/plain').send('Invalid request');
  });

  return app;
}
