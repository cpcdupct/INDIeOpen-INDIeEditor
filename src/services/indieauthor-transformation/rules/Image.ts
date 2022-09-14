import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ImageRule extends AbstractRule implements Rule {
    widget = 'Image';

    private templateWithoutParent =
        "Widget '{{{name}}}': ImageTextOver { help '{{{help}}}', Image { url '{{{imageurl}}}', alt '{{{alt}}}', Original }, Text { html '<p>{{{caption}}}</p>' } } ";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        return this.renderer.render(template, {
            imageurl: element.data.image,
            alt: TransformationUtils.prepareString(element.data.alt),
            caption: TransformationUtils.prepareString(element.data.text, true),
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}
