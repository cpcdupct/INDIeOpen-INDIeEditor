import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class SchemaContainerRule extends AbstractRule implements Rule {
    widget = 'SchemaContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': Schema { help '{{{help}}}', [ {{{images}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const images = [];

        for (const item of element.data) {
            images.push(this.getItem(item));
        }

        return this.renderer.render(template, {
            images,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    getItem(item: any): any {
        const template = "Image { url '{{{image}}}', alt '{{{alt}}}', Original }";
        return this.renderer.render(template, {
            image: item.data.image,
            alt: TransformationUtils.prepareString(item.data.alt)
        });
    }
}
