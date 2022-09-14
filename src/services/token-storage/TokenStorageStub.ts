import moment from 'moment';

import { INDIeOpenWrapper } from '../../services/indie-open-wrapper/INDIeOpenWrapper';

import { TokenInfo } from '../../models/Token';
import { ContentType } from '../../models/ModelEditor';
import { UserSession } from '../../models/User';
import { TokenStorage } from './TokenStorage';

export class TokenStorageStub extends TokenStorage {
    private tokenInfo: TokenInfo = {
        token: 'Token',
        tool: ContentType.COURSE,
        expireAt: new Date(moment().add(3, 'days').date())
    };

    constructor(wrapper: INDIeOpenWrapper) {
        super(wrapper);
    }

    async retrieveToken(token: string, user: UserSession): Promise<TokenInfo> {
        return new Promise(async (resolve, reject) => {
            resolve(this.tokenInfo);
        });
    }

    async findTokenInfoByToken(token: string): Promise<TokenInfo> {
        return new Promise(async (resolve, reject) => {
            resolve(this.tokenInfo);
        });
    }
}
