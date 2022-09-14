import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ImageAndTextRule extends AbstractRule implements Rule {
    widget = 'ImageAndText';

    private templateWithoutParent =
        "Widget '{{{name}}}': ImageTextRight { help '{{{help}}}', Image { url '{{{image}}}', alt '{{{alt}}}', Original}, Text { html '{{{text}}}' } }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        return this.renderer.render(template, {
            text: TransformationUtils.prepareString(element.data.text, true),
            image: element.data.image,
            alt: TransformationUtils.prepareString(element.data.alt),
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}
