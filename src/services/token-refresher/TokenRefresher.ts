import axios, { AxiosInstance } from 'axios';

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
}

/**
 * JWT Token refresher
 */
export class TokenRefresher {
    /** Axios instance for creating requests with a base configuration set in the constructor */
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: process.env.JWT_TOKEN_BASE_URL,
            responseType: 'json'
        });
    }

    /**
     * Refresh a JWT Token using the JWT refresh token
     *
     * @param refreshToken JWT refresh token
     */
    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const data = `refresh_token=${refreshToken}&grant_type=refresh_token`;

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
                'Basic ' +
                Buffer.from(`${process.env.app_client}:${process.env.app_password}`).toString(
                    'base64'
                )
        };

        return new Promise(async (resolve, reject) => {
            this.apiClient
                .post('/token', data, {
                    headers
                })
                .then(response => {
                    resolve({
                        access_token: response.data.access_token,
                        refresh_token: response.data.refresh_token
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}
