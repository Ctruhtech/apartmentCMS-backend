import express from 'express';
import apartmentRouter from './controllers/controller';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 7777;

const corsOptions = {
  origin: true,                     // Reflect the request origin
  credentials: true,               // Allow credentials (cookies)
  allowedHeaders: "*"
};

app.use(cors(corsOptions));

app.use(bodyParser.json());        // for parsing application/json

// apartment router as a middleware
app.use(apartmentRouter);

app.listen(port, () => {
  return console.log(`Running at port: ${port}`);
});