var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import * as Utils from '../model/utils.js';
import eoc from 'express-openid-connect';
const { requiresAuth } = eoc;
export const htmlRouter = express();
htmlRouter.get('/', (req, res) => {
    res.render('../dist/views/home');
});
htmlRouter.get('/singleplayer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // if user is logged in, check if they have chosen a nickname yet.
    let hasNick = true;
    if (res.locals.isAuthenticated && req.oidc.user) {
        const result = yield Utils.hasNickname(req.oidc.user.sub);
        if (result !== undefined)
            hasNick = result;
    }
    res.render('../dist/views/game', {
        gameType: 'singleplayer',
        hasNick: hasNick
    });
}));
htmlRouter.get('/multiplayer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // if user is logged in, check if they have chosen a nickname yet.
    if (req.oidc.user && req.oidc.user.sub)
        console.log(req.oidc.user.sub);
    let hasNick = true;
    if (res.locals.isAuthenticated && req.oidc.user) {
        const result = yield Utils.hasNickname(req.oidc.user.sub);
        if (result !== undefined)
            hasNick = result;
    }
    res.render('../dist/views/game', {
        gameType: 'multiplayer',
        hasNick: hasNick
    });
}));
htmlRouter.get('/profile', requiresAuth(), (req, res) => {
    res.render('../dist/views/profile');
});
htmlRouter.get('/highscores', (req, res) => {
    res.render('../dist/views/highscores');
});
