import * as Handlebars from 'handlebars';

/**
 * Class that uses Handlebars templates for rendering templates in strings with values
 */
export class HandlebarsRenderer {
    /** Singleton instance */
    private static instance: HandlebarsRenderer;

    private constructor() {
        this.registerHelpers();
    }

    /** Gets the HandlerbarsRenderer singleton instance or creates if it does not exist */
    public static getInstance(): HandlebarsRenderer {
        if (!HandlebarsRenderer.instance) {
            HandlebarsRenderer.instance = new HandlebarsRenderer();
        }

        return HandlebarsRenderer.instance;
    }

    /** Render a template using a model */
    public render(template: string, model: any): string {
        const templateInstance = Handlebars.compile(template);
        const text = templateInstance(model);
        return text;
    }

    /** Register handlerbars needed template helpers */
    private registerHelpers() {
        Handlebars.registerHelper('ifeq', (a, b, options) => {
            if (a === b) {
                return options.fn(this);
            }
        });

        // Increment
        Handlebars.registerHelper('inc', (value, options) => {
            return parseInt(value, 10) + 1;
        });
    }
}
