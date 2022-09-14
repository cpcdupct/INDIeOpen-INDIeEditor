import { TranslationService } from '../../translation-service/TranslationService';
import { HandlebarsRenderer } from '../../handlebars-renderer/HandlebarsRenderer';
import { RuleContainer } from '../../indieauthor-transformation/Transform';

export abstract class AbstractRule {
    constructor(
        protected rules: RuleContainer,
        protected renderer: HandlebarsRenderer,
        private translationService: TranslationService
    ) {}

    protected translateString(key: string, language: string) {
        return this.translationService.translate(key, language);
    }
}
