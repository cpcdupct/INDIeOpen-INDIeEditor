import { ContentType } from './ModelEditor';

/**
 * INDIe Token information
 */
export interface TokenInfo {
    /** Plain INDIe Token */
    token: string;
    /** Content of the model editor instance */
    tool: ContentType;
    /** Expiration date */
    expireAt: Date;
}
