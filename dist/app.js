"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controllers/controller"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 7777;
const corsOptions = {
    origin: true, // Reflect the request origin
    credentials: true, // Allow credentials (cookies)
    allowedHeaders: "*"
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.json()); // for parsing application/json
// apartment router as a middleware
app.use(controller_1.default);
app.listen(port, () => {
    return console.log(`Running at port: ${port}`);
});
//# sourceMappingURL=app.js.map