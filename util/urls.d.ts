/**
 * @param {string} iString
 * @returns {string}
 */
export function SafeDecode(iString: string): string;
/**
 * @param {string} iString
 * @returns {string}
 */
export function SafeEscape(iString: string): string;
/**
 * @param {string} iHref
 * @returns {URL}
 */
export function SafeParseURL(iHref: string): URL;
/**
 * @param {string} iReqHeaders
 * @returns {{[name: string]: string}}
 */
export function ParseCookie(iReqHeaders: string): {
    [name: string]: string;
};
/**
 * @param {string | string[]} iPath
 * @returns {string[]}
 */
export function ParsePath(iPath: string | string[]): string[];
/**
 * @param {string} iQuery
 * @returns {{[queryName: string]: string | true}}
 */
export function ParseQuery(iQuery: string): {
    [queryName: string]: string | true;
};
/**
 * @param {{[queryName: string]: string | true}} iQueries
 * @returns {string}
 */
export function CombineQueries(iQueries: {
    [queryName: string]: string | true;
}): string;
/**
 * @param {string} iLoc
 * @returns {string}
 */
export function SetMIMEType(iLoc: string): string;
/**
 * @param {string} iLoc
 * @returns {string}
 */
export function SetCompleteMIMEType(iLoc: string): string;
