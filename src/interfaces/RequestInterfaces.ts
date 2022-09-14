import { Request, Response } from 'express';

/**
 * Extension of Express Request interface to handle internationalization
 */
export interface WebRequest extends Request {
    t?: () => string;
    tn?: () => string;
    getLocale?: () => string;
}

/**
 * Extension of Express Response interface to handle internationalization
 */
export interface WebResponse extends Response {
    t?: () => string;
    tn?: () => string;
    getLocale?: () => string;
}
