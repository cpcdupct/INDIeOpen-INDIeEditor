import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class TrueFalseContainerRule extends AbstractRule implements Rule {
    widget = 'TrueFalseContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': ContainerTrueFalse { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const trueFalseItems = [];

        for (const trueFalseItem of element.data) {
            trueFalseItems.push(this.getItem(trueFalseItem, context));
        }

        return this.renderer.render(template, {
            items: trueFalseItems,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any, context: RuleContext): any {
        const templateItem =
            "{ question: Text { html '{{{question}}}' }, correct: Text { html '{{{correct}}}' }, positiveFeedback: Text { html '{{{positive}}}' }, negativeFeedback: Text { html '{{{negative}}}' } }";
        return this.renderer.render(templateItem, {
            question: TransformationUtils.prepareString(item.data.question),
            correct: item.data.answer ? 'true' : 'false',
            positive: TransformationUtils.prepareString(item.data.feedback.positive),
            negative: TransformationUtils.prepareString(item.data.feedback.negative)
        });
    }
}
