import { Router } from "express";
import * as path from "path";
import {
    adminLoginController,
    adminRefreshTokenController,
    createUserController,
    findOneUserController,
    logoutUserController,
    requestUserPWResetController,
    updateUserPasswordController,
    validateUserPWResetTokenController,
    getPagedUserController
} from "../controllers/admin.auth.controller";

import { Shield } from "../middleware/auth/shield";

const publicKey = path.join(__dirname, "../../config/public.pem");
const shield = new Shield(publicKey);

export const userAuthRouter = Router();

userAuthRouter.post("/login", adminLoginController);
userAuthRouter.post("/refresh-token", adminRefreshTokenController);
userAuthRouter.post("/logout", shield.auth(), logoutUserController);
userAuthRouter.post("/create", shield.auth(), createUserController);
userAuthRouter.get("/get-one/:id", shield.auth(), findOneUserController);
userAuthRouter.post("/get-paged", shield.auth(), getPagedUserController);
userAuthRouter.post("/request-reset-password", requestUserPWResetController);
userAuthRouter.post("/validate-reset-password", validateUserPWResetTokenController);
userAuthRouter.post("/reset-password", updateUserPasswordController);
