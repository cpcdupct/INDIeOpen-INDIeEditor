/* eslint-disable max-len */
import moment from 'moment';

import { TokenInfo } from '../../models/Token';
import { ContentType, CreativeCommons, ModelEditor } from '../../models/ModelEditor';
import { UserSession } from '../../models/User';
import { INDIeOpenWrapper, Preview, Response } from './INDIeOpenWrapper';

export class INDIeOpenStub extends INDIeOpenWrapper {
    async retrieveTokenInfo(token: string): Promise<TokenInfo> {
        return new Promise(async (resolve, reject) => {
            const stub: TokenInfo = {
                token,
                tool: ContentType.COURSE,
                expireAt: new Date(moment().add(3, 'days').date())
            };
            resolve(stub);
        });
    }

    async saveModel(token: string, instance: any, user: UserSession): Promise<Response> {
        return new Promise(async (resolve, reject) => {
            try {
                resolve({
                    status: 200,
                    statusText: 'OK',
                    success: true
                });
            } catch (err) {
                reject({
                    status: 500,
                    statusText: 'ERROR',
                    success: false,
                    error: err
                });
            }
        });
    }

    async previewModel(token: string, previewObject: any, user: UserSession): Promise<Preview> {
        return new Promise(async (resolve, reject) => {
            try {
                resolve({ url: 'https://example.org' });
            } catch (err) {
                reject(err);
            }
        });
    }

    async retrieveModelWithToken(token: string, user: UserSession): Promise<ModelEditor> {
        return new Promise(async (resolve, reject) => {
            try {
                const modelEditor: ModelEditor = this.stubCourseEditor();
                resolve(modelEditor);
            } catch (err) {
                reject(err);
            }
        });
    }

    private stubContentModelEditor(): ModelEditor {
        return {
            type: ContentType.CONTENT,
            name: 'Training unit - Roman theater',
            author: 'User',
            email: 'user@xxx.es',
            institution: 'Institution',
            license: CreativeCommons.BY,
            language: 'ES',
            instance: {
                version: 1,
                sections: [
                    {
                        bookmark: 'Test',
                        image: '',
                        widget: 'Section',
                        data: [
                            {
                                widget: 'ImageAndText',
                                data: {
                                    layout: 0,
                                    image: 'MY_URL_IMAGE',
                                    text: 'Esto es una imagen'
                                },
                                id: '4e1b481249a5',
                                type: 'element',
                                params: { name: 'Imagen' }
                            }
                        ],
                        bakcgroundType: 'BackgroundColour',
                        name: 'Section 1',
                        id: '1f15e523fa39',
                        type: 'section-container'
                    }
                ]
            }
        };
    }

    private stubEvaluationModelEditor(): ModelEditor {
        return {
            type: ContentType.EVALUATION,
            name: 'Training unit - Evaluation',
            author: 'User',
            language: 'ES',
            email: 'user@institution.es',
            institution: 'Institution',
            license: CreativeCommons.BY,
            instance: {
                evaluation: [
                    {
                        answers: [
                            { correct: true, text: '1988' },
                            { correct: false, text: '1991' },
                            { correct: false, text: '1996' },
                            { correct: false, text: '2000' }
                        ],
                        text: 'When was the Roman Theatre discovered?',
                        id: 'c8b6ed6d390c',
                        type: 'single'
                    },
                    {
                        answers: [
                            { correct: false, text: 'Orchestra' },
                            { correct: true, text: 'Cavea' },
                            { correct: false, text: 'Frons scaena' },
                            { correct: false, text: 'Porticus post scaenam' }
                        ],
                        text: 'Where did the spectactors sit in order to watch a play in the Roman Theatre?',
                        id: '51ed6c483cc7',
                        type: 'single'
                    },
                    {
                        answers: [
                            { correct: false, text: 'False' },
                            { correct: true, text: 'true' }
                        ],
                        text: 'The Roman Theatre was discovered by accident',
                        id: 'bf27e6c10119',
                        type: 'trueFalse'
                    }
                ]
            }
        };
    }

    private stubVideoEditor(): ModelEditor {
        return {
            type: ContentType.VIDEO,
            name: 'Training unit - The Roman Theater video',
            author: 'Author',
            email: 'author@institution.es',
            instance: {
                videosource: {
                    src: 'MY_MANIFEST',
                    type: 'application/vnd.ms-sstr+xml'
                },
                editorData: [
                    {
                        data: {
                            start: '0:10:230',
                            coordinates: [],
                            end: '0:10:750',
                            aux_coord: []
                        },
                        children: [
                            {
                                data: {
                                    start: '0:11:430',
                                    coordinates: [['4.9%', '11.2%', '25.5%', '12.6%']],
                                    end: '0:16:710',
                                    text: 'Oranges',
                                    aux_coord: [
                                        [
                                            { $numberInt: '44' },
                                            { $numberInt: '57' },
                                            { $numberInt: '230' },
                                            { $numberInt: '64' }
                                        ]
                                    ]
                                },
                                icon: 'fa fa-genderless',
                                id: '2f329160cc16',
                                text: 'Answer A',
                                type: 'element'
                            },
                            {
                                data: {
                                    start: '0:17:240',
                                    coordinates: [['7.1%', '36.7%', '22.1%', '8.5%']],
                                    end: '0:21:810',
                                    text: 'Cucumbers',
                                    aux_coord: [
                                        [
                                            { $numberInt: '64' },
                                            { $numberInt: '186' },
                                            { $numberInt: '199' },
                                            { $numberInt: '43' }
                                        ]
                                    ]
                                },
                                icon: 'fa fa-genderless',
                                id: 'a6d0f1abcb10',
                                text: 'Answer B',
                                type: 'element'
                            },
                            {
                                data: {
                                    start: '0:22:520',
                                    coordinates: [['7.3%', '63.9%', '20.6%', '7.5%']],
                                    end: '0:28:170',
                                    text: 'Raspberries',
                                    aux_coord: [
                                        [
                                            { $numberInt: '66' },
                                            { $numberInt: '324' },
                                            { $numberInt: '186' },
                                            { $numberInt: '38' }
                                        ]
                                    ]
                                },
                                icon: 'fa fa-genderless',
                                id: 'd363dc6d96a6',
                                text: 'Answer C',
                                type: 'element'
                            }
                        ],
                        icon: 'fa fa-undo',
                        id: '4352f4898cbd',
                        text: 'Initial node',
                        type: 'loop'
                    }
                ]
            }
        };
    }

    private stubCourseEditor(): ModelEditor {
        return {
            type: ContentType.COURSE,
            name: 'Course',
            author: 'Author',
            language: 'ES',
            email: 'author@institution.es',
            institution: 'institution',
            license: CreativeCommons.BY,
            instance: {}
        };
    }
}
