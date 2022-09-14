import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { UserSession } from '../../models/User';

/**
 * Api Wrapper for sending web requests to the backend
 */
export class Api {
    /** Axios instance for creating requests with a base configuration set in the constructor */
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: process.env.INDIEOPEN_URL,
            responseType: 'json'
        });
    }

    /**
     * Creates and sends a GET Request to the backend.
     *
     * @param url URL to make the request.
     * @param user Information about the user who makes the request
     * @param params Optional. Query parameters.
     *
     * @returns A promise containing the web response
     */
    get(url: string, user: UserSession, params?: any): Promise<AxiosResponse> {
        if (params) {
            return this.apiClient.get(url, {
                params,
                headers: this.getHeaders(user)
            });
        } else {
            return this.apiClient.get(url, {
                headers: this.getHeaders(user)
            });
        }
    }

    /**
     * Creates and sends a POST Request to the backend.
     *
     * @param url URL to make the request.
     * @param data An object containing the body data for the request.
     * @param user Information about the user who makes the request
     *
     * @returns A promise containing the web response
     */
    post(
        url: string,
        data: any,
        user: UserSession,
        textPlain: boolean = false
    ): Promise<AxiosResponse> {
        const headers = this.getHeaders(user);

        if (textPlain) headers['Content-Type'] = 'text/plain';

        return this.apiClient.post(url, data, {
            headers
        });
    }

    /**
     * Creates the required headers given the user information. Content Type, Authorization and Tenant ID
     *
     * @param user Information about the user who m akes the request
     *
     * @returns Headers
     */
    private getHeaders(user: UserSession) {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + user.access_token,
            'X-TenantID': user.tenant
        };
    }
}
