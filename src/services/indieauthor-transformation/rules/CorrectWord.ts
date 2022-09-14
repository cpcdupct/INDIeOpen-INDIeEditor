/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../Utils';
import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class CorrectWordRule extends AbstractRule implements Rule {
    widget = 'CorrectWord';

    private templateWithoutParent =
        "Widget '{{{name}}}': CorrectWord { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const correctWordItem of element.data) {
            items.push(this.getItem(correctWordItem));
        }
        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const template =
            "{ question: Text { html '{{{question}}}' }, image: Image { url '{{{image}}}', alt '{{{alt}}}', Original }, answer: Text { html '{{{word}}}' } }";
        return this.renderer.render(template, {
            question: TransformationUtils.prepareString(item.data.question),
            word: TransformationUtils.prepareString(item.data.word),
            image: item.data.image,
            alt: TransformationUtils.prepareString(item.data.alt)
        });
    }
}
