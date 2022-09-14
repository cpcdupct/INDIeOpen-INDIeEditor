import { Controller, Get } from '@overnightjs/core';
import { WebRequest, WebResponse } from 'interfaces/RequestInterfaces';
import { Cipher } from '../services/cipher/Cipher';
import { BaseController } from './BaseController';

/**
 * Default root controller to indicate the app status
 */
@Controller('/')
export class DefaultController extends BaseController {
    constructor(cipherService: Cipher) {
        super(cipherService);
    }

    /**
     * Default slash route
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get('')
    default(req: WebRequest, res: WebResponse) {
        this.render(res, 'default', {});
    }
}
