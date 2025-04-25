import {createEmployeeRefNo} from "../util/refferenceNumbers";
import {
    createEmployeeRepo,
    findOneAndUpdateEmployeeRepo,
    findOneEmployeeRepo,
    getPagedEmployeesRepo,getPagedEmployeesTeachersRepo
} from "../data-access/employee.repo";
import {sendEmailService} from "./email.service";
import {SETTINGS} from "../constants/commons.settings";
import {createLoggerService} from "./logger.service";

export const createEmployeeService = async (data: any, reqUserId: any) => {
    try {
        const empCheck: any = await findOneEmployeeRepo({nic: data.nic});
        if (empCheck) {
            throw {message: "Employee NIC is already existing!", empCheck: true};
        } else {
            data.refNo = await createEmployeeRefNo();
            const employee: any = await createEmployeeRepo(data);
            await createLoggerService(SETTINGS.LOG_STATUS.CREATE, reqUserId,
                `${employee.refNo} (${employee.firstname + ' ' + employee.lastname}) Employee record has been created.`
            );
            if (employee.email) {
                sendEmailService(
                    SETTINGS.EMAIL.EMPLOYEE_NEW_SEND,
                    {
                        name: employee.firstname + " " + employee.lastname,
                    },
                    employee.email,
                    `Welcome to SALARMan System`
                );
            }
            return employee;
        }
    } catch (e) {
        throw e;
    }
};

export const getPagedEmployeeService = async (data: any) => {
    try {
        return await getPagedEmployeesRepo(data);
    } catch (e) {
        throw e;
    }
};
export const getPagedEmployeeTeachersService = async (data: any) => {
    try {
        return await getPagedEmployeesTeachersRepo(data);
    } catch (e) {
        throw e;
    }
};

export const findOneAndUpdateEmployeeService = async (data: any, reqUserId: any) => {
    try {
        const type = data?.type
        const employee: any = await findOneAndUpdateEmployeeRepo({_id: data.id}, data);
        switch (type) {
            case "STATUS":
                await createLoggerService(SETTINGS.LOG_STATUS.STATUS_CHANGE, reqUserId,
                    `${employee.refNo} (${employee.firstname + ' ' + employee.lastname}) Employee status has been ${employee.active ? 'activated' : 'deactivated'}.`
                );
                break
            case "DELETE":
                await createLoggerService(SETTINGS.LOG_STATUS.DELETE, reqUserId,
                    `${employee.refNo} (${employee.firstname + ' ' + employee.lastname}) Employee record has been deleted.`
                );
                break
            default:
                await createLoggerService(SETTINGS.LOG_STATUS.UPDATE, reqUserId,
                    `${employee.refNo} (${employee.firstname + ' ' + employee.lastname}) Employee record has been updated.`
                );
                break
        }
        return employee

    } catch (e) {
        throw e;
    }
};

export const findOneEmployeeByIdService = async (id: any) => {
    try {
        const result: any = await findOneEmployeeRepo({_id: id});
        return result;
    } catch (e) {
        throw e;
    }
};
