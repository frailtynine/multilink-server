import {Router, Request, Response} from 'express';

const helloRouter = Router();

helloRouter.get('/hello', (req: Request, res: Response) => {
    res.send('Hello, World!');
});

export default helloRouter;