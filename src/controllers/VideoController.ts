import { Controller, Get, Post } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { StatusCodes } from 'http-status-codes';
import { Cipher } from '../services/cipher/Cipher';

import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { INDIeOpenWrapper } from '../services/indie-open-wrapper/INDIeOpenWrapper';
import { VideoTransform } from '../services/indievideo-transform/Transform';
import { TokenStorage } from '../services/token-storage/TokenStorage';

import { TokenInfo } from '../models/Token';
import { ContentType, ModelEditor } from '../models/ModelEditor';
import { BaseController } from './BaseController';

/**
 * Controller that handles the Video Editor functionalities.
 */
@Controller('editor/video/')
export class VideoController extends BaseController {
    constructor(
        private tokenStorage: TokenStorage,
        private indieWrapper: INDIeOpenWrapper,
        cipherService: Cipher
    ) {
        super(cipherService);
    }

    /**
     * Route that renders the editor index page that loads and prepares the video editor.
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get(':token')
    async contentEditorIndex(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const tokenInfo: TokenInfo = await this.tokenStorage.findTokenInfoByToken(token);

        if (!tokenInfo) return res.redirect('/entry/' + token);

        const model: ModelEditor = await this.indieWrapper.retrieveModelWithToken(
            token,
            this.getUserSession(req)
        );

        if (model.type !== ContentType.VIDEO) {
            Logger.Err('Type is not video');
            return this.renderError(
                res,
                { message: 'The type associated with the token is not video' },
                'Type mismatch'
            );
        }

        return this.render(res, 'video', { model, token, name: model.name });
    }

    /**
     * Route that recieves a save model request from the video editor and sends it to the backend.
     * The response is sent in JSON to the editor.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Post(':token/save')
    async saveModel(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const model: ModelEditor = req.body;

        try {
            this.indieWrapper.saveModel(token, model, this.getUserSession(req));
            return res.status(StatusCodes.OK).json({ success: true });
        } catch (err) {
            Logger.Err(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
        }
    }

    /**
     * Route that recieves a preview request from the evaluation editor and sends it to the backend.
     * The response is sent in JSON to the editor and it contains the interactive data for the video player.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Post(':token/preview')
    async previewModel(req: WebRequest, res: WebResponse) {
        const model: ModelEditor = req.body;
        const transformer: VideoTransform = new VideoTransform(model.instance.editorData);
        const interactiveData: any[] = transformer.runTransformation();
        return res.status(StatusCodes.OK).json({ interactiveData });
    }
}
