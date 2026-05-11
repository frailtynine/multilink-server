"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const port = Number(process.env.PORT ?? 3000);
if (Number.isNaN(port)) {
    throw new Error('PORT must be a valid number');
}
app_1.default.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
