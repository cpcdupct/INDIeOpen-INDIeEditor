import { Logger } from '@overnightjs/logger';
import moment from 'moment';
import Datastore from 'nedb';
import { TokenInfo } from '../../models/Token';
import { UserSession } from '../../models/User';

import { INDIeOpenWrapper } from '../../services/indie-open-wrapper/INDIeOpenWrapper';

/**
 * Class that handles the INDIe token retrival, cache and storage in nedb
 */
export class TokenStorage {
    /** Nedb datastore instance */
    private dataStore: Datastore<TokenInfo>;

    constructor(private wrapper: INDIeOpenWrapper) {
        this.dataStore = new Datastore();
    }

    /**
     * Retrieve a TokenInfo instance with the information about the token provided by the user
     *
     * @param token INDIE token
     * @param user User that makes the request
     */
    async retrieveToken(token: string, user: UserSession): Promise<TokenInfo> {
        // 1 Token must be valid
        if (!token) return undefined;

        // 2 If the token already exists in the database, check the expire date
        const existingTokenInfo = await this.findTokenInfoByToken(token);
        if (existingTokenInfo) {
            // 2.1 If now is before the expired date then reutrn the token
            if (this.isTokenValid(existingTokenInfo)) {
                return existingTokenInfo;
            } else {
                // 2.2 If its after then delete the token and request a new one
                this.removeToken(existingTokenInfo);
            }
        }

        // 3 If the token does not exist, retrieve the information from indieopen
        const retrievedTokenInfo: TokenInfo = await this.wrapper.retrieveTokenInfo(token, user);
        if (retrievedTokenInfo) {
            this.insertToken(retrievedTokenInfo);
            return retrievedTokenInfo;
        } else {
            return undefined;
        }
    }

    /**
     * Find a TokenInfo instance from the datastore given the INDIe token
     *
     * @param token  INDIe token
     */
    async findTokenInfoByToken(token: string): Promise<TokenInfo> {
        return new Promise(resolve => {
            this.dataStore.findOne({ token }, (err, document) => {
                if (err) {
                    resolve(undefined);
                } else {
                    resolve(document);
                }
            });
        });
    }

    /**
     * Clear the expired token in the datastore
     */
    clearExpiredTokens() {
        try {
            const invalidTtokens = this.dataStore
                .getAllData()
                .filter(t => moment(moment.now()).isAfter(t.expireAt));

            for (const t of invalidTtokens) {
                this.dataStore.remove({ token: t.token });
            }

            Logger.Info(`Cleared ${invalidTtokens.length} expired tokens`);
        } catch (err) {
            Logger.Err(err);
            Logger.Err('ERROR DELETING INVALID TOKENS');
        }
    }

    /**
     * Check if the token is not expired. A token is valid if the current time is before the expireAt parameter
     *
     * @param tokenInfo TokenInfo instance to be validated
     */
    private isTokenValid(tokenInfo: TokenInfo) {
        return moment(moment.now()).isBefore(moment(tokenInfo.expireAt));
    }

    /**
     * Insert a token to the datastore
     *
     * @param tokenInfo TokenInfo instance to be inserted
     */
    private insertToken(tokenInfo: TokenInfo) {
        this.dataStore.insert(tokenInfo);
    }

    /**
     * Remove a token from the datastore
     *
     * @param tokenInfo TokenInfo instance to be deleted
     */
    private removeToken(tokenInfo: TokenInfo) {
        this.dataStore.remove({ token: tokenInfo.token });
    }
}
