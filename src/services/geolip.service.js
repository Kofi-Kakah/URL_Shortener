const countryHeaders = [
	"cf-ipcountry",
	"x-vercel-ip-country",
	"cloudfront-viewer-country",
	"fastly-client-country",
	"x-appengine-country",
];

function readHeader(req, name) {
	return req.get?.(name) ?? req.headers?.[name];
}

function getCountryCode(req) {
	for (const header of countryHeaders) {
		const value = readHeader(req, header);
		if (typeof value !== "string") continue;

		const countryCode = value.trim().toUpperCase();
		if (/^[A-Z]{2}$/.test(countryCode) && countryCode !== "XX") return countryCode;
	}

	return null;
}

function getBrowser(userAgent) {
	const browsers = [
		["Samsung Internet", /SamsungBrowser\/([\d.]+)/i],
		["Edge", /Edg(?:e|A|iOS)?\/([\d.]+)/i],
		["Opera", /(?:OPR|Opera)\/([\d.]+)/i],
		["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/i],
		["Chrome", /(?:Chrome|CriOS)\/([\d.]+)/i],
		["Internet Explorer", /(?:MSIE\s|rv:)([\d.]+).*?(?:Trident\/|$)/i],
		["Safari", /Version\/([\d.]+).*Safari/i],
	];

	for (const [name, pattern] of browsers) {
		const match = userAgent.match(pattern);
		if (match) return `${name} ${match[1].split(".")[0]}`;
	}

	return null;
}

function getOperatingSystem(userAgent) {
	if (/Windows NT/i.test(userAgent)) return "Windows";
	if (/Android/i.test(userAgent)) return "Android";
	if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
	if (/CrOS/i.test(userAgent)) return "Chrome OS";
	if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
	if (/Linux/i.test(userAgent)) return "Linux";
	return null;
}

function getDeviceType(userAgent) {
	if (!userAgent || /bot|crawler|spider|preview/i.test(userAgent)) return null;
	if (/iPad|Tablet|Kindle|Silk|PlayBook|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
	if (/Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini/i.test(userAgent)) return "mobile";
	return "desktop";
}

/** Extract click metadata from trusted edge headers and the request User-Agent. */
export function getClickMetadata(req) {
	const userAgent = readHeader(req, "user-agent") ?? "";

	return {
		countryCode: getCountryCode(req),
		deviceType: getDeviceType(userAgent),
		browser: getBrowser(userAgent),
		operatingSystem: getOperatingSystem(userAgent),
	};
}
