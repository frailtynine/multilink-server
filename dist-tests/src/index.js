"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./logging/logger");
const port = Number(process.env.PORT ?? 3000);
(0, logger_1.setupLoggingFromEnv)();
const logger = (0, logger_1.getLogger)('server');
if (Number.isNaN(port)) {
    throw new Error('PORT must be a valid number');
}
app_1.default.listen(port, () => {
    logger.info('Server started', {
        port,
        url: `http://localhost:${port}`,
    });
});
