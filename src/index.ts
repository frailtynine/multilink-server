import express from 'express';
import helloRouter from './endpoints/helloWorldController';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api', helloRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});