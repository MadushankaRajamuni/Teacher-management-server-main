import {log} from "../util/logger";
import {
    aggregateUserRepo,
    createUserPwReset,
    createUserRepo, findOneAndUpdateUserRepo,
    findOneUserRepo, findUserPwResetToken, findUserPwResetTokenAndDelete,
    getLoggedUserRepo,getPagedUserRepo
} from "../data-access/admin.repo";
import bcrypt from "bcrypt";
import {SETTINGS} from "../constants/commons.settings";
import {generateJWT} from "./token.service";
import {findOneAndDeleteUserRefreshTokenRepo} from "../data-access/token.repo";
import passwordGen from "generate-password";
import {createUserRefNo} from "../util/refferenceNumbers";
import config from "config";
import {sendEmailService} from "./email.service";
import { v4 as uuidv4 } from "uuid";



export const signInUserService = async (password: any, email: any) => {
    try {
        const admin = (await aggregateUserRepo({ email }))[0];
        if (!admin) {
            throw { message: "Authentication failed, Retry!" };
        }
        if (!admin.active) {
            throw {
                message: "Inactive User!",
            };
        }
        return await validateUser(password, admin);
    } catch (e: any) {
        log.error(e.message || "User not found");
        throw e;
    }
};

const validateUser = async (password: any, admin: any) => {
    try {
        const result = await bcrypt.compare(password, admin.password);
        if (!result) {
            throw { message: "Authentication failed, Retry!" };
        }
        return await generateJWT(admin, false, SETTINGS.USERS.ADMIN);
    } catch (e: any) {
        log.error(e.message);
        throw e;
    }
};

export const logoutUserService = async (data: any) => {
    await findOneAndDeleteUserRefreshTokenRepo(data);
};

export const createUserService = async (data: any) => {
    try {
        const emailCheck: any = await findOneUserRepo({ email: data.email });
        if (emailCheck) {
            throw { message: "Email is already existing!", emailCheck: true };
        } else {
            const password = passwordGen.generate({
                length: 6,
                uppercase: false,
            });
            data.password = password;
            data.refNo = await createUserRefNo();
            const admin: any = await createUserRepo(data);
            sendEmailService(
                SETTINGS.EMAIL.USER_NEW_PASSWORD_SEND,
                {
                    name: admin.firstname + " " + admin.lastname,
                    email: admin.email,
                    password,
                    url: `${config.get("frontEndUrl")}/auth/login`.toString(),
                },
                admin.email,
                `Welcome to SALARMan System`
            );
            admin.password = undefined;
            return admin;
        }
    } catch (e) {
        throw e;
    }
};

export const getOneUserService = async (id: any) => {
  try {
      return (await getLoggedUserRepo(id))[0];
  } catch (e: any) {
      throw e
  }

};
export const getPagedUserService = async (data: any) => {
    try {
        return await getPagedUserRepo(data);
    } catch (e) {
        throw e;
    }
};

export const requestUserPasswordResetService = async (email: any, userType: any) => {
    try {
        let user;
        switch (userType) {
            case SETTINGS.USERS.ADMIN:
                const admin: any = await findOneUserRepo({ email });
                user = {
                    _id: admin._id,
                    name: admin.firstname + " " + admin.lastname,
                };
                break;
        }

        if (user?._id && user?.name) {
            log.info("Found User for password reset.");
            const pwResetData: any = await createUserPwReset({
                user: user?._id,
                token: uuidv4(),
            });
            log.info("Password reset token created.");
            sendEmailService(
                SETTINGS.EMAIL.PASSWORD_RESET,
                {
                    url: `${config.get("frontEndUrl")}/auth/reset-password/${
                        pwResetData.token
                    }`.toString(),
                    name: user?.name,
                },
                email,
                "Password Reset"
            );
            return {
                done: true,
                message: "Password reset link sent to your Email.",
            };
        } else {
            return {
                done: false,
                message: "No user was found for this Email.",
            };
        }
    } catch (e) {
        throw e;
    }
};

export const validateUserPWResetTokenService = async (token: any) => {
    try {
        const pwReset: any = await findUserPwResetToken({ token });
        if (pwReset) {
            return { done: true, message: "Token validated.", data: pwReset };
        } else {
            return { done: false, message: "Invalid or expired token." };
        }
    } catch (e) {
        throw e;
    }
};
export const validateAndUpdateUserPwService = async (token: any, password: any, userType: any) => {
    try {
        const pwReset: any = await findUserPwResetToken({ token });
        let user;
        switch (userType) {
            case SETTINGS.USERS.ADMIN:
                const admin: any = await findOneUserRepo({ _id: pwReset.user });
                user = {
                    _id: admin._id,
                    name: admin.firstname + " " + admin.lastname,
                    email: admin.email,
                    url: `${config.get("frontEndUrl")}/auth/login`.toString(),
                };
                break;
        }

        if (pwReset && user?._id && user?.email && user?.name) {
            await Promise.all([
                passwordUpdateRepoCheck(user?._id, password, userType),
                findUserPwResetTokenAndDelete({ token }),
            ]);
            log.info("sending mail");
            sendEmailService(
                SETTINGS.EMAIL.PASSWORD_CHANGED,
                {
                    url: user?.url,
                    name: user?.name,
                },
                user.email,
                "Password reset successfully"
            );
            return { done: true, message: "Password reset successfully" };
        } else {
            log.info("reset failed. Invalid or expired token.");
            return {
                done: false,
                message: "Password reset failed. Invalid or expired token.",
            };
        }
    } catch (e) {
        throw e;
    }
};

const passwordUpdateRepoCheck = (useId: any, password: any, userType: any) => {
    switch (userType) {
        case SETTINGS.USERS.ADMIN:
            return findOneAndUpdateUserRepo({ _id: useId }, { password });
    }
};
