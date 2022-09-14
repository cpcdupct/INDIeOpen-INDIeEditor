/* eslint-disable @typescript-eslint/quotes */
import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class CouplesContainerRule extends AbstractRule implements Rule {
    widget = 'CouplesContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': Couples {  help '{{{help}}}', [ {{{couples}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        const couples = [];

        for (const coupleItem of element.data) {
            couples.push(this.getItem(coupleItem));
        }

        return this.renderer.render(template, {
            couples,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const templateText = "Text { html '{{{text}}}' }";
        const templateImg = "Image { url '{{{image}}}', alt '{{{alt}}}', Original } ";
        const templateCouple = '{ first: {{{template1}}}, second: {{{template2}}} }';
        const templates = item.data.couples.map(couple => {
            return couple.type === 'image'
                ? this.renderer.render(templateImg, {
                      image: couple.image,
                      alt: TransformationUtils.prepareString(couple.alt)
                  })
                : this.renderer.render(templateText, {
                      text: TransformationUtils.prepareString(couple.text, true)
                  });
        });

        return this.renderer.render(templateCouple, {
            template1: templates[0],
            template2: templates[1]
        });
    }
}
