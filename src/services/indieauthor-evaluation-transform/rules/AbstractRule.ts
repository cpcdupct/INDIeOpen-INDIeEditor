import { HandlebarsRenderer } from '../../../services/handlebars-renderer/HandlebarsRenderer';

/**
 * Base rule
 */
export abstract class AbstractRule {
    /** Template renderer */
    protected renderer: HandlebarsRenderer;

    constructor() {
        this.renderer = HandlebarsRenderer.getInstance();
    }
}
