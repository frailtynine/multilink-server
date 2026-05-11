import swaggerUi from 'swagger-ui-express';
import app from './baseApp';
import openApiDocument from './generated/swagger.json';
import { RegisterRoutes } from './generated/routes';
app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

RegisterRoutes(app);

export default app;
