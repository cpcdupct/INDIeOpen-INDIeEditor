import { Controller, Put } from '@overnightjs/core';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '@overnightjs/logger';
import { TokenRefresher } from '../services/token-refresher/TokenRefresher';
import { Cipher } from '../services/cipher/Cipher';
import { WebRequest, WebResponse } from '../interfaces/RequestInterfaces';
import { UserSession } from '../models/User';
import { BaseController } from './BaseController';

/**
 * JWT Token refresher controller
 */
@Controller('refresh/')
export class TokenRefresherController extends BaseController {
    constructor(cipherService: Cipher, private tokenRefresher: TokenRefresher) {
        super(cipherService);
    }

    /**
     * JWT token refresh request handler
     */
    @Put('')
    async refreshToken(req: WebRequest, res: WebResponse) {
        // Get the current session
        const currentSession = this.getUserSession(req);

        try {
            // Refresh the token
            const jwtTokenResponse = await this.tokenRefresher.refreshToken(
                currentSession.refresh_token
            );

            // Create the cookie with the new values
            const cookieValue: string = this.createCookie(
                currentSession,
                jwtTokenResponse.access_token,
                jwtTokenResponse.refresh_token
            );

            // Return the values to the client to store in the cookie
            return res.status(StatusCodes.OK).json({ success: true, cookie: cookieValue });
        } catch (err) {
            Logger.Err(err);
            return res.status(err.status).json({ success: false, statusText: err.statusText });
        }
    }

    /**
     * Creates a new cookie value and ciphers it
     *
     * @param currentSession User's current session
     * @param accesstoken JWT access token
     * @param refreshtoken  JWT refresh token
     *
     * @returns Literal string cookie value
     */
    private createCookie(
        currentSession: UserSession,
        accesstoken: string,
        refreshtoken: string
    ): string {
        const newSession: UserSession = {
            access_token: accesstoken,
            refresh_token: refreshtoken,
            id: currentSession.id,
            tenant: currentSession.tenant
        };

        return this.cipherService.encrypt(JSON.stringify(newSession));
    }
}
