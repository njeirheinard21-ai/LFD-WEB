const https = require('https');

https.get('https://maps.app.goo.gl/eALLSQ4UwnskjEsb6', (res) => {
  console.log('Location:', res.headers.location);
}).on('error', (e) => {
  console.error(e);
});
