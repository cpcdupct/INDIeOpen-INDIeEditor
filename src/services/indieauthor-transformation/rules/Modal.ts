import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ModalRule extends AbstractRule implements Rule {
    widget = 'Modal';

    private templateWithoutParent =
        "Widget '{{{name}}}': ModalButton { help '{{{help}}}', { name: Text { html '{{{text}}}' }, content: [{{{items}}}] } }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const modalElement of element.data) {
            items.push(this.rules.rule(modalElement.widget).do(modalElement, element, context));
        }

        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            text: TransformationUtils.prepareString(element.params.text),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}
