import * as forge from 'node-forge';

/**
 * Class that encapsultaes encryption with environment parameters
 */
export class Cipher {
    constructor(private key: string, private iv: string) {}

    /**
     * Encrypt a string and encode in Base64.
     *
     * @param plainString String to be encrypted
     *
     * @returns base64 encrypted string
     */
    public encrypt(plainString: string): string {
        const cipher = forge.cipher.createCipher('MY_CIPHER', this.key);
        cipher.start({ iv: this.iv });
        cipher.update(forge.util.createBuffer(plainString));
        cipher.finish();
        return forge.util.encode64(cipher.output.data);
    }

    /**
     * Desencrypt a base64 string
     *
     * @param encryptedString Base64 encrypted string
     *
     * @returns desencrypted string
     */
    public decrypt(encryptedString: string): string {
        const decipher = forge.cipher.createDecipher('MY_CIPHER', this.key);
        const decodedB64 = forge.util.decode64(encryptedString);
        decipher.start({ iv: this.iv });
        decipher.update(forge.util.createBuffer(decodedB64));
        decipher.finish();

        return decipher.output.data;
    }
}
