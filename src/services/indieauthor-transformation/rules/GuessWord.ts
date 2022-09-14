/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../Utils';
import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class GuessWordRule extends AbstractRule implements Rule {
    widget = 'GuessWord';

    private templateWithoutParent =
        "Widget '{{{name}}}': Hangman { help '{{{help}}}', { question: Text { html '{{{question}}}' }, solution: Text { html '{{{answer}}}' }, attempts: Int { {{{attempts}}} } } }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        return this.renderer.render(template, {
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help),
            question: TransformationUtils.prepareString(element.data.question),
            answer: TransformationUtils.prepareString(element.data.answer),
            attempts: parseInt(element.data.attempts)
        });
    }
}
