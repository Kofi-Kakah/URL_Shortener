const bodyParserMessages = {
	400: "Invalid request body.",
	413: "Request body is too large.",
};

/** Convert forwarded request and database errors into safe JSON responses. */
export function errorMiddleware(error, _req, res, next) {
	if (res.headersSent) return next(error);

	let status = Number(error?.status ?? error?.statusCode);
	let message;

	if (error?.code === "P2002") {
		status = 409;
		message = "A record with these values already exists.";
	} else if (error?.code === "P2025") {
		status = 404;
		message = "Requested record not found.";
	} else if (error?.type === "entity.parse.failed") {
		status = 400;
		message = bodyParserMessages[status];
	} else if (error?.type === "entity.too.large") {
		status = 413;
		message = bodyParserMessages[status];
	}

	if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
	if (!message) message = status < 500 ? bodyParserMessages[status] ?? "Request failed." : "Internal server error";

	if (status >= 500) console.error(error);
	return res.status(status).json({ error: message });
}
