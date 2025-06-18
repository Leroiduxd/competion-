import express from 'express';
import { updateTraders } from './update.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send("Trader update API is live."));

app.get('/recalculate', async (req, res) => {
  const result = await updateTraders();
  res.json(result);
});

app.listen(port, () => {
  console.log('API running on port', port);
});