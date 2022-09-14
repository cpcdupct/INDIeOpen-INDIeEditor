import { Controller, Get, Post } from '@overnightjs/core';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '@overnightjs/logger';
import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { Cipher } from '../services/cipher/Cipher';
import { TokenStorage } from '../services/token-storage/TokenStorage';
import { INDIeOpenWrapper } from '../services/indie-open-wrapper/INDIeOpenWrapper';
import { ContentType, ModelEditor } from '../models/ModelEditor';
import { TokenInfo } from '../models/Token';
import { Api } from '../services/api/Api';
import { UserSession } from '../models/User';
import { BaseController } from './BaseController';

// eslint-disable-next-line no-shadow
enum UnitResourceType {
    CONTENT = 'CONTENT',
    EVALUATION = 'EVALUATION'
}

interface UnitResource {
    name: string;
    id: string;
    description: string;
    cover: string;
    type: UnitResourceType;
    link: string;
}

@Controller('editor/course/')
export class CourseController extends BaseController {
    instances: any[] = [];

    constructor(
        private tokenStorage: TokenStorage,
        private indieWrapper: INDIeOpenWrapper,
        cipherService: Cipher,
        private api: Api
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
    async editorIndex(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const tokenInfo: TokenInfo = await this.tokenStorage.findTokenInfoByToken(token);

        if (!tokenInfo) return res.redirect('/entry/' + token);

        const model: ModelEditor = await this.indieWrapper.retrieveModelWithToken(
            token,
            this.getUserSession(req)
        );

        if (model.type !== ContentType.COURSE) {
            Logger.Err('Type is not course');
            return this.renderError(
                res,
                { message: 'The type associated with the token is not course' },
                'Type mismatch'
            );
        }

        const units: UnitResource[] = await this.retrieveUnits(token, this.getUserSession(req));

        return this.render(res, 'course', {
            model,
            token,
            units,
            name: model.name
        });
    }

    @Post(':token/save')
    saveModel(req: WebRequest, res: WebResponse) {
        const token: string = req.params.token;
        const model = { instance: req.body.instance };

        this.instances.push(model);

        this.indieWrapper
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

    private async retrieveUnits(token: string, user: UserSession): Promise<UnitResource[]> {
        return this.api
            .get('/editor/course/units/' + token, user)
            .then(response => {
                const units: UnitResource[] = response.data as UnitResource[];

                units.forEach(element => {
                    element.link = this.getUnitLinkForUser(element.link, user.tenant);
                });

                return response.data;
            })
            .catch(err => {
                Logger.Err(err, true);
                return [];
            });
    }

    private getUnitLinkForUser(link: string, tenant: string): string {
        return `${process.env.RESOURCESERVER}/${link}/?origin=${tenant}`;
    }
}
