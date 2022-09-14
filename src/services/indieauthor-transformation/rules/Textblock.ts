import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class TextBlockRule extends AbstractRule implements Rule {
    widget = 'TextBlock';

    private templateWithParent = "row {column { width '12' Text { html '{{{text}}}' } } } ";
    private templateWithoutParent = "Text { html '{{{text}}}' } ";

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        return this.renderer.render(template, {
            text: TransformationUtils.prepareString(element.data.text, true)
        });
    }
}
