import { Controller, Get } from '@overnightjs/core';
import { StatusCodes } from 'http-status-codes';
import { Cipher } from '../services/cipher/Cipher';

import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { TokenStorage } from '../services/token-storage/TokenStorage';

import { TokenInfo } from '../models/Token';
import { ContentType } from '../models/ModelEditor';
import { BaseController } from './BaseController';

/**
 * The entry point controller for the editor (/ entry). From this controller
 * the backend will be asked for information about the INDIe token and it will be redirected
 * based on the information.
 */
@Controller('entry/')
export class EntryController extends BaseController {
    constructor(private tokenStorage: TokenStorage, cipherService: Cipher) {
        super(cipherService);
    }

    /**
     * Route that renders the entry page that starts the token load process
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get(':token')
    index(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        if (token) return this.render(res, 'load', { token });
        else return this.renderError(res, {}, 'Error');
    }

    /**
     * Routes that retrieves the token information and passes it throug json response
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get('load/:token')
    async load(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const currentUserRequest = this.getUserSession(req);

        try {
            const tokenInfo: TokenInfo = await this.tokenStorage.retrieveToken(
                token,
                currentUserRequest
            );

            if (!tokenInfo)
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Invalid token'
                });

            const editorUrl = this.getEditorUrlFromType(tokenInfo.tool);
            if (editorUrl) {
                return res.status(StatusCodes.OK).json({ editor: editorUrl + tokenInfo.token });
            } else {
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'Internal error' });
            }
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Internal error communicating with the server'
            });
        }
    }

    /**
     * Get the editor URL according the content type of a token
     *
     * @param tool Type of content that a token has
     */
    private getEditorUrlFromType(tool: ContentType): string | undefined {
        switch (tool) {
            case ContentType.CONTENT:
                return '/editor/content/';
            case ContentType.EVALUATION:
                return '/editor/evaluation/';
            case ContentType.VIDEO:
                return '/editor/video/';
            case ContentType.COURSE:
                return '/editor/course/';
            default:
                return undefined;
        }
    }
}
