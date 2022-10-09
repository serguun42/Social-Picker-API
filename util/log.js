const DEV = require("./is-dev");
const { writeFile } = require("fs/promises");

/**
 * @param  {(string | Error)[]} args
 * @returns {void}
 */
const LogMessageOrError = (...args) => {
	const containsAnyError = (args.findIndex((message) => message instanceof Error) > -1);
	const out = (containsAnyError ? console.error : console.log);

	out(new Date());
	out(...args);
	out("~~~~~~~~~~~\n\n");

	if (DEV) writeFile("./out/logmessageorerror.json", JSON.stringify(args, false, "\t")).catch(console.warn);
};

module.exports = LogMessageOrError;
