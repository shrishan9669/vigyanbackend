"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const adminrouter = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
adminrouter.delete('/deleteuser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.user.deleteMany({});
        return res.json({
            msg: "User deleted!!"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
adminrouter.delete('/deletepurchase', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.purchase.deleteMany({});
        return res.json({
            msg: "Delete purchase"
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }
}));
module.exports = adminrouter;
