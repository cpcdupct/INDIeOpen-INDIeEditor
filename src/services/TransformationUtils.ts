/* eslint-disable @typescript-eslint/quotes */
import sanitizeHtml, { IOptions } from 'sanitize-html';
import { Utils } from './Utils';

export class TransformationUtils {
    static htmlOptions: IOptions = {
        allowedTags: [
            'table',
            'tr',
            'td',
            'tbody',
            'thead',
            'h1',
            'h2',
            'h3',
            'h4',
            'li',
            'ol',
            'p',
            'pre',
            'ul',
            'a',
            'br',
            'em',
            'i',
            'u',
            'ul',
            'strong',
            'span',
            'del'
        ],
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedAttributes: {
            a: ['href', 'name', 'target'],
            table: ['class']
        },
        allowedSchemesAppliedToAttributes: ['href']
    };

    /**
     * Prepares a TEX formula string compatible with the DSL grammar
     *
     * @param formula TEX Formula
     *
     * @returns formula prepared
     */
    public static prepareFormula(formula: string): string {
        formula = formula.replace(/\\/g, '\\\\');
        return formula;
    }

    /**
     * Prepares a literal string compatible with the DSL grammar and clear of HTML threads.
     *
     * @param  literalString Literal String
     * @param  isHtml Boolean indicating that the literal string is, in fact, an HTML
     *
     * @returns string prepared
     */
    public static prepareString(literalString: string, isHtml: boolean = false): string {
        literalString = literalString.replace(/\\/g, '\\\\'); // double
        literalString = literalString.replace(/'/g, "\\'"); // remove simple
        literalString = literalString.replace(/\s+/g, ' ');
        literalString = literalString.trim();

        if (isHtml) literalString = sanitizeHtml(literalString, this.htmlOptions);
        else
            literalString = sanitizeHtml(literalString, {
                allowedTags: [],
                allowedAttributes: {}
            });

        return literalString;
    }

    /**
     * Get the id of a youtube URL
     *
     * @param url Youtube url
     */
    public static getYoutubeId(url: string): string {
        const regExp =
            /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[7].length === 11 ? match[7] : undefined;
    }

    /**
     * Get the start time from a youtube url
     *
     * @param url Youtube url
     */
    public static getYoutubeStartTime(url: string): number {
        const parameters = Utils.getAllUrlParams(url);
        if (parameters.t) return parseInt(parameters.t, 10);
        else if (parameters.start) return parseInt(parameters.start, 10);
        else return 0;
    }

    /**
     * Returns wether a url is an interactive video url
     *
     * @param url URL
     */
    public static isInteractiveVideo(url: string): boolean {
        return this.isUrlWithinDomains(url, [
            'MY_URL_DOMAIN1',
            'MY_URL_DOMAIN2'
        ]);
    }

    /**
     * Returns wether a URL is a youtube video
     *
     * @param url URL
     */
    public static isYoutubeVideoURL(url: string): boolean {
        const p = new RegExp(
            /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
        );
        return p.test(url);
    }

    /**
     * Returns wether a string parameter is a URL
     *
     * @param st String parameter
     */
    public static isURL(st: string): boolean {
        const regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        return regex.test(st);
    }

    /**
     * Return wether a URL is within domains
     *
     * @param url URL
     * @param allowedDomains URL Domains
     */
    public static isUrlWithinDomains(url: string, allowedDomains: string[]): boolean {
        if (!this.isURL(url)) return false;

        for (const allowedDomain of allowedDomains) {
            if (url.startsWith(allowedDomain)) return true;
        }

        return false;
    }

    /**
     * Returns wether a URL is an INDIe resource
     *
     * @param url URL
     */
    public static isIndieResource(url: string): boolean {
        return this.isUrlWithinDomains(url, [
            'MY_URL_DOMAIN1',
            'MY_URL_DOMAIN2'
        ]);
    }
}
