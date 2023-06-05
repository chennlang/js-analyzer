
const { createLogger, format, transports } = require("winston");

export default createLogger({
    format: format.combine(
        format.label({ label: 'Js Analyzer' }),
        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
        format.align(),
        format.prettyPrint(),
        // format.printf(
        //     (info: any) =>
        //         `${info.label} ${[info.timestamp]} level-${info.level}, message: ${info.message}`
        // )
    ),
    transports: [
        new transports.Console(),
    ],
});
