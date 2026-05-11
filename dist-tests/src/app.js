"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const baseApp_1 = __importDefault(require("./baseApp"));
const swagger_json_1 = __importDefault(require("./generated/swagger.json"));
const routes_1 = require("./generated/routes");
baseApp_1.default.get('/openapi.json', (_req, res) => {
    res.json(swagger_json_1.default);
});
baseApp_1.default.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
(0, routes_1.RegisterRoutes)(baseApp_1.default);
exports.default = baseApp_1.default;
