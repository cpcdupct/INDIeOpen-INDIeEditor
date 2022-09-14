import * as path from 'path';
import cookieParser from 'cookie-parser';

import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import * as express from 'express';
import * as cron from 'node-cron';
import cors from 'cors';
import * as localization from 'i18n';
import * as nunjucks from 'nunjucks';
import { WebRequest, WebResponse } from './interfaces/RequestInterfaces';
import versionInfo from './version-info.json';

import {
    ContentEditorController,
    CourseController,
    DefaultController,
    EntryController,
    EvaluationEditorController,
    INDIeOpenController,
    TokenRefresherController,
    VideoController
} from './controllers';
import { Cipher } from './services/cipher/Cipher';

import { Api } from './services/api/Api';
import { INDIeOpenStub } from './services/indie-open-wrapper/INDIeOpenStub';
import { INDIeOpenWrapper } from './services/indie-open-wrapper/INDIeOpenWrapper';
import { TokenStorage } from './services/token-storage/TokenStorage';
import { TokenStorageStub } from './services/token-storage/TokenStorageStub';
import { TokenRefresher } from './services/token-refresher/TokenRefresher';


export class Application extends Server {
    constructor() {
        super(process.env.NODE_ENV === 'development'); // setting showLogs to true
        this.setUpServer();
        this.setupDependenciesAndControllers();
    }

    public start(): void {
        const port = process.env.PORT || 3000;
        this.app.listen(port, () => {
            Logger.Imp('----------------------------------------------');
            Logger.Imp('----------------------------------------------');
            Logger.Imp('Server listening on port: ' + port);
            Logger.Imp('----------------------------------------------');
            Logger.Imp('----------------------------------------------');
            Logger.Imp('Environment setup:');
            Logger.Imp('----------------------------------------------');
            Logger.Imp('INDIEOPEN_URL: ' + process.env.INDIEOPEN_URL);
            Logger.Imp('----------------------------------------------');
            Logger.Imp('Application started');
        });
    }

  
    private setUpServer(): void {
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
        this.app.use(cookieParser());
        this.app.use(
            cors({
                origin: process.env.allowedOrigins.split(',')
            })
        );

        localization.configure({
            locales: ['en', 'es', 'fr', 'el', 'lt'],
            defaultLocale: 'en',
            cookie: 'lang',
            queryParameter: 'lang',
            directory: path.join(__dirname, 'public', 'assets', 'i18n'),
            autoReload: true,
            api: {
                __: 't', 
                __n: 'tn' 
            }
        });

        this.app.use(localization.init); 
        const env = nunjucks.configure(path.join(__dirname, 'views'), {
            autoescape: true,
            express: this.app
        });

        this.app.use((req: WebRequest, res: WebResponse, next: () => void): void => {
            env.addGlobal('translate', req.t);
            env.addGlobal('pluralTranslate', req.tn);
            env.addGlobal('locale', req.getLocale);


            env.addGlobal('resource', (resourceUrl: string) => {
                return `${resourceUrl}?v=${versionInfo.version}`;
            });

            env.addGlobal('version', () => {
                return `?v=${versionInfo.version}`;
            });

            next();
        });

        this.app.set('view engine', 'njk');
    }

  
    private setupDependenciesAndControllers(): void {
        const api: Api = new Api();
        const cipherService: Cipher = new Cipher(process.env.secretKey, process.env.iv);
        const tokenRefresher: TokenRefresher = new TokenRefresher();

        const wrapper: INDIeOpenWrapper = new INDIeOpenWrapper(api); 
        const tokenStorage: TokenStorage = new TokenStorage(wrapper); 
        cron.schedule('0 0 0 * * *', tokenStorage.clearExpiredTokens.bind(tokenStorage));

        const indexController: EntryController = new EntryController(tokenStorage, cipherService);

        const contentEditorController: ContentEditorController = new ContentEditorController(
            tokenStorage,
            wrapper,
            cipherService
        );

        const indieOpenController: INDIeOpenController = new INDIeOpenController(cipherService);

        const evaluationController: EvaluationEditorController = new EvaluationEditorController(
            tokenStorage,
            wrapper,
            api,
            cipherService
        );
        const videoController: VideoController = new VideoController(
            tokenStorage,
            wrapper,
            cipherService
        );

        const courseController = new CourseController(tokenStorage, wrapper, cipherService, api);

        const defaultController: DefaultController = new DefaultController(cipherService);

        const jwtRefreshController: TokenRefresherController = new TokenRefresherController(
            cipherService,
            tokenRefresher
        );

        super.addControllers([
            indexController,
            contentEditorController,
            indieOpenController,
            evaluationController,
            videoController,
            courseController,
            defaultController,
            jwtRefreshController
        ]);
    }
}
