import { Controller, Post } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { StatusCodes } from 'http-status-codes';
import { Cipher } from '../services/cipher/Cipher';

import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { EvaluationTransform } from '../services/indieauthor-evaluation-transform/Transform';
import { Migrator } from '../services/indieauthor-migration/Migrator';
import { ContentTransformation } from '../services/indieauthor-transformation/Transform';
import { VideoTransform } from '../services/indievideo-transform/Transform';

import { ContentType, ModelEditor } from '../models/ModelEditor';

import { BaseController } from './BaseController';

/**
 * Controller that handles the requests sent by the Backend.
 */
@Controller('indieopen/')
export class INDIeOpenController extends BaseController {
    constructor(cipherService: Cipher) {
        super(cipherService);
    }

    /**
     * Route that transform a unit or video inside a Model Editor sent by the backend.
     *
     * @param req HTTP Request object
     * @param res  HTTP Response object
     */
    @Post('transform/')
    async transformUnit(req: WebRequest, res: WebResponse) {
        const model: ModelEditor = req.body;
        try {
            const transform: any = this.getTransformation(model);
            Logger.Info(transform, true);
            return res.status(StatusCodes.OK).json({ success: true, content: transform });
        } catch (err) {
            Logger.Err(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
        }
    }

    /**
     * Run transformation according to the content type of the model
     *
     * @param model Complete editor model
     */
    private getTransformation(model: ModelEditor): any {
        if (model.type === ContentType.CONTENT) {
            return this.transformContent(model);
        } else if (model.type === ContentType.EVALUATION) {
            return this.transformEvaluation(model);
        } else if (model.type === ContentType.VIDEO) {
            return this.transformVideo(model);
        } else {
            return undefined;
        }
    }

    /**
     * Run a video transformation of a given model.
     *
     * @param model Complete editor model
     */
    private transformVideo(model: ModelEditor): any[] {
        const transformer: VideoTransform = new VideoTransform(model.instance.editorData);
        return transformer.runTransformation();
    }

    /**
     * Run a evaluation transformation of a given model.
     *
     * @param model Complete editor model
     */
    private transformEvaluation(model: ModelEditor): string {
        const transformer: EvaluationTransform = new EvaluationTransform(
            {
                language: model.language,
                mode: model.mode,
                user: model.author,
                title: model.name,
                email: model.email,
                institution: model.institution,
                license: model.license,
                theme: model.theme,
                resourceId: model.resourceId,
                analytics: model.analytics
            },
            model.instance.evaluation
        );
        return transformer.runTransformation();
    }

    /**
     * Run a content transformation of a given model.
     *
     * @param model Complete editor model
     */
    private transformContent(model: ModelEditor): string {
        // Migration
        if (Migrator.migrationNeeded(model.instance.version)) {
            const migrator: Migrator = new Migrator({
                sections: model.instance.sections,
                version: model.instance.version,
                language: model.language
            });

            model.instance.version = Migrator.currentVersion;
            model.instance.sections = migrator.runMigrations();
        }

        // Run transformation
        const transformer: ContentTransformation = new ContentTransformation(
            {
                language: model.language,
                title: model.name,
                user: model.author,
                email: model.email,
                institution: model.institution,
                license: model.license,
                mode: model.mode,
                theme: model.theme,
                resourceId: model.resourceId,
                analytics: model.analytics
            },
            model.instance.sections
        );
        return transformer.runTransformation();
    }
}
