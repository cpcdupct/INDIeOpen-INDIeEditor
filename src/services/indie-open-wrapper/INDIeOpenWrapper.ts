import { Logger } from '@overnightjs/logger';
import moment from 'moment';

import { UserSession } from '../../models/User';
import { ContentType, CreativeCommons, ModelEditor } from '../../models/ModelEditor';
import { Api } from '../../services/api/Api';
import { TokenInfo } from '../../models/Token';

/**
 * Model Preview response
 */
export interface Preview {
    /** Resource URL */
    url: string;
}

/**
 * Basic response from the server
 */
export interface Response {
    /** Repsonse status */
    status: number;
    /** Response status text */
    statusText: string;
    /** Request success */
    success: boolean;
    /** Response error if it's the case */
    error?: any;
}

/**
 * Class that has all the common functions that requires the editor to use to comunicate with the backend
 */
export class INDIeOpenWrapper {
    constructor(private api: Api) {}

    /**
     * Returns a default internal server error response
     *
     * @param err Error object
     *
     * @returns
     */
    getDefaultServerError(err: any): Response {
        return {
            status: 500,
            statusText: 'Internal server error',
            success: false,
            error: err
        };
    }

    /**
     * Returns an error response from the server
     *
     * @param err Error object
     *
     * @returns
     */
    getErrorResponse(err: any): Response {
        return {
            status: err.response.status,
            statusText: err.response.statusText,
            success: false,
            error: err
        };
    }

    /**
     * Return wether an object is a INDIeError
     *
     * @param err error object
     *
     * @returns true if is a indie error, false otherwise
     */
    isINDIeError(err: any): boolean {
        return err.response;
    }

    /**
     * Send a web request to the backend that saves an editor model instance according to the token resource information (type, user...etc)s
     *
     * @param token Token of the resource
     * @param instance Instance of the corresponding editor data
     * @param user User that makes the request
     *
     * @returns Server response
     */
    async saveModel(token: string, instance: any, user: UserSession): Promise<Response> {
        return new Promise(async (resolve, reject) => {
            this.api
                .post('/editor/save/' + token, instance, user)
                .then(response => {
                    resolve({
                        status: response.status,
                        statusText: response.statusText,
                        success: true
                    });
                })
                .catch(err => {
                    Logger.Err(err);
                    if (this.isINDIeError(err)) {
                        reject(this.getErrorResponse(err));
                    } else {
                        reject(this.getDefaultServerError(err));
                    }
                });
        });
    }

    /**
     * Send a web request to the backend that ask for a preview for a model given.
     *
     * @param token Editor token
     * @param previewObject Plain text editor model
     * @param user User that makes the request
     *
     * @returns Model Preview response
     */
    async previewModel(token: string, previewObject: string, user: UserSession): Promise<Preview> {
        return new Promise(async (resolve, reject) => {
            this.api
                .post('/editor/preview/' + token, previewObject, user, true)
                .then(response => {
                    resolve({ url: response.data.url });
                })
                .catch(err => {
                    Logger.Err(err);
                    if (this.isINDIeError(err)) {
                        reject(this.getErrorResponse(err));
                    } else {
                        reject(this.getDefaultServerError(err));
                    }
                });
        });
    }

    /**
     * Sends a request to the backend to get the model of the editor given a token generated in INDIe
     *
     * @param token INDIe editor token
     * @param user User that makes the request
     *
     * @returns Editor model
     */
    async retrieveModelWithToken(token: string, user: UserSession): Promise<ModelEditor> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.api.get('editor/load/' + token, user);
                const modelEditor: ModelEditor = this.getModelEditorFromResponseData(response.data);
                resolve(modelEditor);
            } catch (err) {
                Logger.Err(err);
                if (this.isINDIeError(err)) {
                    reject(this.getErrorResponse(err));
                } else {
                    reject(this.getDefaultServerError(err));
                }
            }
        });
    }

    /**
     * Sends a request to the backend to get the information about a given INDIe token.
     *
     * @param token INDIe token
     * @param user User that makes the request
     *
     * @returns Token info
     */
    async retrieveTokenInfo(token: string, user: UserSession): Promise<TokenInfo> {
        return new Promise(async (resolve, reject) => {
            this.api
                .get('/editor/info/' + token, user)
                .then(response => {
                    const tokenInfo: TokenInfo = this.createFromResponseData(token, response.data);
                    resolve(tokenInfo);
                })
                .catch(err => {
                    Logger.Err(err);
                    if (this.isINDIeError(err)) {
                        reject(this.getErrorResponse(err));
                    } else {
                        reject(this.getDefaultServerError(err));
                    }
                });
        });
    }

    /**
     * Creates a TokenInfo instance from a web response of the Backend
     *
     * @param token INDIe Token
     * @param data Response data
     *
     * @return TokenInfo instance
     */
    private createFromResponseData(token: string, data: any): TokenInfo {
        return {
            expireAt: moment(data.expireAt).toDate(),
            token,
            tool: ContentType[data.type]
        };
    }

    /**
     * Creates a ModelEditor instance from a web response of the Backend
     *
     * @param data Response data
     *
     * @returns ModelEditor instance
     */
    private getModelEditorFromResponseData(data: any): ModelEditor {
        // Required fields
        const modelEditor: ModelEditor = {
            author: data.author,
            type: ContentType[data.type],
            name: data.name,
            language: data.language,
            email: data.email,
            instance: JSON.parse(data.instance)
        };

        // Optional fields
        if (data.license) modelEditor.license = data.license as CreativeCommons;
        if (data.institution) modelEditor.institution = data.institution;
        if (data.theme) modelEditor.theme = data.theme;
        if (data.resourceId) modelEditor.resourceId = data.resourceId;

        return modelEditor;
    }
}
