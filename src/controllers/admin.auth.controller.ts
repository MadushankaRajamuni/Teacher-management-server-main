
import { log } from "../util/logger";
import {
    createUserService,
    getOneUserService,
    logoutUserService, requestUserPasswordResetService,
    signInUserService, validateAndUpdateUserPwService, validateUserPWResetTokenService,
    getPagedUserService
} from "../services/admin.auth.service";
import {validateRefreshTokenReq} from "../services/token.service";
import {SETTINGS} from "../constants/commons.settings";

export const adminLoginController = async (req: any, res: any) => {
    log.info("User login started");
    if (!req.body.email) {
        log.error("Email not found");
        return res.status(404).send({ message: "Email not found" });
    }
    const email = req.body.email.toLowerCase();
    try {
        res.send(await signInUserService(req.body.password, email));
    } catch (e) {
        log.error(e);
        res.status(403).send(e);
    }
};

export const adminRefreshTokenController = async (req: any, res: any) => {
    log.info("User token refresh started");
    const rToken = req.body.refreshToken;
    if (!rToken) {
        log.error("Refresh token not found");
        return res
            .status(402)
            .send({ code: 1000, message: "Refresh token not found" });
    } else {
        try {
            res.send(
                await validateRefreshTokenReq(
                    true,
                    rToken,
                    SETTINGS.USERS.ADMIN
                )
            );
        } catch (e) {
            log.error(e);
            res.status(403).send(e);
        }
    }
};

export const logoutUserController = async (req: any, res: any) => {
    log.info("User login out");
    try {
        await logoutUserService({ user: req.user.userId });
        log.info("Logout Successful");
        return res.status(200).send({ message: "Log out successful" });
    } catch (e) {
        log.error("Logout Unsuccessful");
        return res.status(403).send({ error: "Logout Unsuccessful" });
    }
};

export const createUserController = async (req: any, res: any) => {
    log.info("Creating user");
    try {
        const data = await createUserService(req.body);
        res.send(data);
        log.info("Creating user completed");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};
export const findOneUserController = async (req: any, res: any) => {
    log.info("Finding one user start");
    try {
        const data = await getOneUserService(req.params.id);
        res.send(data);
        log.info("Finding one user completed");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};
export const requestUserPWResetController = async (req: any, res: any) => {
    log.info("Requesting Reset Password");
    try {
        const data = await requestUserPasswordResetService(req.body.email, SETTINGS.USERS.ADMIN);
        res.send(data);
        log.info("Requesting Reset Password completed");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};

export const validateUserPWResetTokenController = async (req: any, res: any) => {
    log.info("Validating Reset Password");
    try {
        const data = await validateUserPWResetTokenService(req.body.token);
        res.send(data);
        log.info("Validating Reset Password completed");
    } catch (e) {
        return res.status(400).send(e);
    }
};
export const updateUserPasswordController = async (req: any, res: any) => {
    log.info("Resetting Password");
    try {
        const { token, password } = req.body;
        const data = await validateAndUpdateUserPwService(token, password, SETTINGS.USERS.ADMIN);
        res.send(data);
        log.info("Resetting Password completed");
    } catch (e) {
        return res.status(400).send(e);
    }
};


export const getPagedUserController = async (req: any, res: any) => {
    log.info("Getting paged Users");
    try {
        const data = await getPagedUserService(req.body);
        res.send(data);
        log.info("Getting paged Users completed");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};
