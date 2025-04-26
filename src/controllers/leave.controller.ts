import { log } from "../util/logger";
import {
    createLeaveService,
    getPagedLeaveService,
    findOneAndUpdateLeaveService,
    getLeaveSummeryTeacherService
} from "../services/leave.service";

export const createLeaveController = async (req: any, res: any) => {
    log.info("Creating leave request");

    try {
        if (!req.user || !req.user.userId) {
            return res.status(400).send("User not authenticated");
        }

        const data = await createLeaveService(req.body, req.user.userId);
        res.status(201).send(data);
        log.info("Leave request created successfully");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};

export const getPagedLeaveController = async (req: any, res: any) => {
    log.info("Getting paged Leave");
    try {
        const data = await getPagedLeaveService(req.body);
        res.send(data);
        log.info("Getting paged Leave completed");
    } catch (e) {
        log.error(JSON.stringify(e));
        return res.status(400).send(e);
    }
};

// export const findOneAndUpdateLeaveController = async (req: any, res: any) => {
//     log.info("Updating Leave");
//     try {
//         const { _id, status } = req.body;
//         log.info("Request payload: " + JSON.stringify(req.body));

//         const result = await findOneAndUpdateLeaveService(req.body, req.user.userId);
//         res.send(result);
//         log.info("Updating Leave completed");
//     } catch (e) {
//         log.error("Error updating leave: " + JSON.stringify(e));
//         res.status(400).send(e);
//     }
// };

export const findOneAndUpdateLeaveController = async (req: any, res: any) => {
    log.info("Updating Leave");
    try {
        const { _id, status } = req.body;
        log.info("Request payload: " + JSON.stringify(req.body));

        // Make sure both _id and status are present
        if (!_id || !status) {
            return res.status(400).send("Both _id and status are required");
        }

        // Call the service to update the leave
        const result = await findOneAndUpdateLeaveService(_id, status);
        res.send(result);
        log.info("Updating Leave completed");
    } catch (e) {
        log.error("Error updating leave: " + JSON.stringify(e));
        res.status(400).send(e);
    }
};
export const getLeaveSummeryTeacherController = async (req: any, res: any) => {
    log.info("get leave summer");
    try {
        log.info("Request payload: " + JSON.stringify(req.body));
        const result = await getLeaveSummeryTeacherService(req.params.id);
        res.send(result);
        log.info("get leave summer completed");
    } catch (e) {
        log.error("Error updating leave: " + JSON.stringify(e));
        res.status(400).send(e);
    }
};

