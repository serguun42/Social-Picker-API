const DEV = require("./is-dev");
const { writeFile } = require("fs");

/**
 * @param  {(string | Error)[]} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
	const containsAnyError = (args.findIndex((message) => message instanceof Error) > -1),
		  out = (containsAnyError ? console.error : console.log);

	out(new Date());
	args.forEach((message) => out(message));
	out("~~~~~~~~~~~\n\n");

	if (DEV) writeFile("./out/logmessageorerror.json", JSON.stringify(args, false, "\t"), () => {});
};

module.exports = LogMessageOrError;
