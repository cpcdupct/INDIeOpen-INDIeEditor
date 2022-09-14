/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../Utils';
import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ButtonTextRule extends AbstractRule implements Rule {
    widget = 'ButtonTextContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': ButtonText { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const buttonTextItem of element.data) {
            items.push(this.getItem(buttonTextItem));
        }

        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const template =
            "{ image: Image { url '{{{image}}}', alt '{{{alt}}}', Original  }, text: Text { html '{{{text}}}'} }";

        return this.renderer.render(template, {
            image: item.data.image,
            alt: TransformationUtils.prepareString(item.data.alt),
            text: TransformationUtils.prepareString(item.data.text, true)
        });
    }
}
