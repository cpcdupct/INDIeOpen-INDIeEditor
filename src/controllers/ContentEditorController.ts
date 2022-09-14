import { Controller, Get, Post } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { StatusCodes } from 'http-status-codes';
import { Cipher } from '../services/cipher/Cipher';

import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { INDIeOpenWrapper } from '../services/indie-open-wrapper/INDIeOpenWrapper';
import { Migrator } from '../services/indieauthor-migration/Migrator';
import { ContentTransformation } from '../services/indieauthor-transformation/Transform';
import { TokenStorage } from '../services/token-storage/TokenStorage';

import { TokenInfo } from '../models/Token';
import { ContentType, ModelEditor, TransformationMode } from '../models/ModelEditor';
import { BaseController } from './BaseController';

/**
 * Controller that handles the Content Editor functionalities.
 */
@Controller('editor/content/')
export class ContentEditorController extends BaseController {
    constructor(
        private tokenStorage: TokenStorage,
        private indieWrapper: INDIeOpenWrapper,
        cipherService: Cipher
    ) {
        super(cipherService);
    }

    /**
     * Route that renders the editor index page that loads and prepares the content editor.
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get(':token')
    async contentEditorIndex(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const tokenInfo: TokenInfo = await this.tokenStorage.findTokenInfoByToken(token);

        if (!tokenInfo) return res.redirect('/entry/' + token);

        try {
            const model: ModelEditor = await this.indieWrapper.retrieveModelWithToken(
                token,
                this.getUserSession(req)
            );

            if (model.type !== ContentType.CONTENT) {
                Logger.Err('Type is not content');

                return this.renderError(
                    res,
                    {
                        message: 'The type associated with the token is not content'
                    },
                    'Type mysmatch'
                );
            }

            if (Migrator.migrationNeeded(model.instance.version)) {
                const migrator: Migrator = new Migrator({
                    sections: model.instance.sections,
                    version: model.instance.version,
                    language: model.language ? model.language : 'en'
                });

                model.instance.version = Migrator.currentVersion;
                model.instance.sections = migrator.runMigrations();
            }

            return this.render(res, 'content', {
                model,
                token,
                name: model.name
            });
        } catch (error) {
            Logger.Err(error, true);
            return this.renderError(res, {
                error
            });
        }
    }

    /**
     * Route that recieves a save model request from the content editor and sends it to the backend.
     * The response is sent in JSON to the editor.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Post(':token/save')
    saveModel(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const model: ModelEditor = req.body;

        const instance: any = {
            version: Migrator.currentVersion,
            sections: model.instance.sections
        };

        this.indieWrapper
            .saveModel(token, { instance }, this.getUserSession(req))
            .then(response => {
                return res
                    .status(StatusCodes.OK)
                    .json({ success: response.success, statusText: response.statusText });
            })
            .catch(err => {
                return res.status(err.status).json({ success: false, statusText: err.statusText });
            });
    }

    /**
     * Route that recieves a preview request from the evaluation editor and sends it to the backend.
     * The response is sent in JSON to the editor and it contains the preview URL.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Post(':token/preview/')
    previewModel(req: WebRequest, res: WebResponse) {
        const model: ModelEditor = req.body;
        const token: string = req.params.token;

        const transformation: ContentTransformation = new ContentTransformation(
            {
                language: model.language,
                title: model.name,
                user: model.author,
                email: model.email,
                institution: model.institution,
                license: model.license,
                mode: TransformationMode.PREVIEW,
                theme: model.theme
            },
            model.instance.sections
        );
        const transformed: string = transformation.runTransformation();

        this.indieWrapper
            .previewModel(token, transformed, this.getUserSession(req))
            .then(preview => {
                return res.status(StatusCodes.OK).json({ success: true, url: preview.url });
            })
            .catch(err => {
                return res.status(err.status).json({ success: false, statusText: err.statusText });
            });
    }
}
