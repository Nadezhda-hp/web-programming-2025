import express from 'express';

export const login = 'nadya0_q';
export const sample = 'function task(x) { return x * this * this; }';
export const promise = "function task(x) { return x < 18 ? Promise.resolve('yes') : Promise.reject('no'); }";
const fetchPage = `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Запрос к веб-ресурсу</title>
<style>body{font:18px system-ui;max-width:740px;margin:64px auto;padding:24px;color:#17253a;background:#f5f7fa}label{display:block;margin:24px 0 8px}input{box-sizing:border-box;width:100%;padding:14px;font:inherit;border:1px solid #8595aa;border-radius:8px}button{margin-top:16px;padding:12px 22px;font:inherit;border:0;border-radius:8px;background:#174bc5;color:white;cursor:pointer}p{line-height:1.5}#status{min-height:2em}</style>
<h1>Запрос к веб-ресурсу</h1>
<p>Введите адрес ресурса. Его текстовый ответ появится в этом же поле.</p>
<label for="inp">Адрес ресурса или полученный ответ</label>
<input id="inp" type="text" autocomplete="off">
<button id="bt" type="button">Получить ответ</button>
<p id="status" role="status"></p>
<script>
const inp = document.getElementById('inp');
const bt = document.getElementById('bt');
const status = document.getElementById('status');
bt.addEventListener('click', async () => {
  bt.disabled = true;
  status.textContent = 'Выполняется запрос…';
  try {
    const response = await fetch(inp.value);
    const result = await response.text();
    inp.value = result;
    status.textContent = response.ok ? 'Ответ получен.' : 'Получен ответ с кодом ' + response.status;
  } catch (error) {
    status.textContent = 'Не удалось получить ответ. Проверьте адрес и разрешение доступа к ресурсу.';
  } finally {
    bt.disabled = false;
  }
});
</script>
</html>`;

export default function createApp() {
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
  app.options(/.*/, (req, res) => {
    res.status(204).end();
  });

  app.get('/', (req, res) => {
    res.type('text/plain').send(login);
  });

  app.get('/login/', (req, res) => {
    res.type('text/plain').send(login);
  });

  app.get('/sample/', (req, res) => {
    res.type('text/plain').send(sample);
  });

  app.get('/promise/', (req, res) => {
    res.type('text/plain').send(promise);
  });

  app.get('/fetch/', (req, res) => {
    res.type('html').send(fetchPage);
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
