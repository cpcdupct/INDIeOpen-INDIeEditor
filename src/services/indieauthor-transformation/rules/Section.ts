import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class SectionRule extends AbstractRule implements Rule {
    widget = 'Section';

    private template = "Section '{{{bookmark}}}' { title '{{{title}}}' {{{rows}}} } ";

    do(element: any, parent: any, context: RuleContext): string {
        const rows = [];
        for (const content of element.data) {
            rows.push(this.rules.rule(content.widget).do(content, element, context));
        }

        return this.renderer.render(this.template, {
            title: TransformationUtils.prepareString(element.name),
            rows,
            bookmark: TransformationUtils.prepareString(element.bookmark)
        });
    }
}
