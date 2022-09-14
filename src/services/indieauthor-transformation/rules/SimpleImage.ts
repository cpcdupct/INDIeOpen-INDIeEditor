import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class SimpleImageRule extends AbstractRule implements Rule {
    widget = 'SimpleImage';

    private templateWithoutParent =
        " Image { url '{{{imageurl}}}', alt '{{{alt}}}', {{#ifeq aspect 'original'}} Original {{/ifeq}} {{#ifeq aspect 'fit'}} Fit {{/ifeq}} } ";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        let template;

        if (parent.type === 'section-container') template = this.templateWithParent;
        else template = this.templateWithoutParent;

        return this.renderer.render(template, {
            imageurl: element.data.image,
            alt: TransformationUtils.prepareString(element.data.alt),
            name: TransformationUtils.prepareString(element.params.name),
            aspect: element.params.aspect
        });
    }
}
