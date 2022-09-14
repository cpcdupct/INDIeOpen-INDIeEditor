import { Logger } from '@overnightjs/logger';
import { UserSession } from '../models/User';
import { Cipher } from '../services/cipher/Cipher';
import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';

/**
 * Class that has the common functionalities for all controllers in the application
 */
export abstract class BaseController {
    constructor(protected cipherService: Cipher) {}

    /**
     * Render a view with view params and an optional title
     *
     * @param res WebResponse instance
     * @param viewName Name of the view to be rendered
     * @param params View params in an object
     * @param title Title in string
     */
    protected render(res: WebResponse, viewName: string, params: any, title?: string) {
        if (title) params.title = title;

        res.render(viewName, params);
    }

    /**
     * Render an error
     *
     * @param res WebResponse instance
     * @param params View params in an object
     * @param title Title in string
     */
    protected renderError(res: WebResponse, params: any, title?: string) {
        if (title) params.title = title;

        res.render('error', params);
    }

    /**
     * Get the current user info form the INDIe Cookie
     *
     * @param req WebRequest instance
     */
    protected getUserSession(req: WebRequest): UserSession {
        const cookieValue = req.cookies.INDIE_USER;

        if (!cookieValue) {
            throw new Error('INDIe User Cookie not set');
        } else {
            try {
                const decodedCookie = this.cipherService.decrypt(cookieValue);
                return JSON.parse(decodedCookie);
            } catch (err) {
                Logger.Err(err);
                Logger.Err('INDIe user cookie is not valid');
            }
        }
    }
}
