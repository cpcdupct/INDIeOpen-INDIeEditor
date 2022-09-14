import { Controller, Get, Post } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { StatusCodes } from 'http-status-codes';
import { Cipher } from '../services/cipher/Cipher';

import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { Api } from '../services/api/Api';
import { INDIeOpenWrapper } from '../services/indie-open-wrapper/INDIeOpenWrapper';
import { EvaluationTransform } from '../services/indieauthor-evaluation-transform/Transform';
import { TokenStorage } from '../services/token-storage/TokenStorage';

import { TokenInfo } from '../models/Token';
import { ContentType, ModelEditor, TransformationMode } from '../models/ModelEditor';
import { BaseController } from './BaseController';

/**
 * Controller that handles the Evaluation Editor functionalities.
 */
@Controller('editor/evaluation/')
export class EvaluationEditorController extends BaseController {
    constructor(
        private tokenStorage: TokenStorage,
        private wrapper: INDIeOpenWrapper,
        private api: Api,
        cipherService: Cipher
    ) {
        super(cipherService);
    }

    /**
     * Route that renders the editor index page that loads and prepares the evaluation editor
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Get(':token')
    async evaluationEditorIndex(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const tokenInfo: TokenInfo = await this.tokenStorage.findTokenInfoByToken(token);

        if (!tokenInfo) return res.redirect('/entry/' + token);

        try {
            const model: ModelEditor = await this.wrapper.retrieveModelWithToken(
                token,
                this.getUserSession(req)
            );

            if (model.type !== ContentType.EVALUATION) {
                Logger.Err('Type is not evaluation');

                return res.render('error', {
                    title: 'Type mismatch',
                    message: 'The type associated with the token is not evaluation'
                });
            }

            return this.render(res, 'evaluation', { model, token, name: model.name });
        } catch (error) {
            return this.renderError(res, { error }, 'Error');
        }
    }

    /**
     * Route that recieves a save model request from the evaluation editor and sends it to the backend.
     * The response is sent in JSON to the editor.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Post(':token/save')
    saveModel(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const model = { instance: { evaluation: req.body.questions } };

        this.wrapper
            .saveModel(token, model, this.getUserSession(req))
            .then(response => {
                return res
                    .status(StatusCodes.OK)
                    .json({ success: response.success, statusText: response.statusText });
            })
            .catch(err => {
                Logger.Err(err, true);
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

        const transformer: EvaluationTransform = new EvaluationTransform(
            {
                language: model.language,
                user: model.author,
                title: model.name,
                email: model.email,
                institution: model.institution,
                license: model.license,
                mode: TransformationMode.PREVIEW,
                theme: model.theme
            },
            model.instance.evaluation
        );
        const transformed: string = transformer.runTransformation();

        Logger.Info(transformed, true);

        this.wrapper
            .previewModel(token, transformed, this.getUserSession(req))
            .then(preview => {
                return res.status(StatusCodes.OK).json({ success: true, url: preview.url });
            })
            .catch(err => {
                return res.status(err.status).json({ success: false, statusText: err.statusText });
            });
    }

    /**
     * Route that retrieves the questions of a user from the backend.
     * The response is a JSON containing an array of questions.
     *
     * @param req HTTP Request object
     * @param res HTTP Response object
     */
    @Get(':token/questions/')
    retrieveQuestions(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;

        this.api
            .get('/editor/evaluation/questions/' + token, this.getUserSession(req))
            .then(response => {
                return res.status(StatusCodes.OK).json({ success: true, questions: response.data });
            })
            .catch(err => {
                return res
                    .status(err.response.status)
                    .json({ success: false, statusText: err.response.statusText });
            });
    }
}
