import bunyan from "bunyan";

export const log = bunyan.createLogger({
    name: "salarman-connect-backend",
});
