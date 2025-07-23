const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/mpesa/validation', (req, res) => {
  console.log('Validation:', req.body);
  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: 'Validation accepted'
  });
});

app.post('/mpesa/confirmation', (req, res) => {
  console.log('Confirmation:', req.body);
  return res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('M-PESA Daraja server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
