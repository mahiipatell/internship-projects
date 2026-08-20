const app = require('./src/app');
const { port } = require('./src/config/env');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Restaurant Management API listening on port ${port}`);
});
