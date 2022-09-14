/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../Utils';
import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class SentenceOrderRule extends AbstractRule implements Rule {
    widget = 'SentenceOrderContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': SentenceOrder { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';
    private templateText = "Text {html '{{{text}}}'}";

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const sentenceOrderItem of element.data) {
            items.push(this.getItem(sentenceOrderItem));
        }
        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const template = '{ solutions: [{{{answers}}}], words: [{{{words}}}] }';
        const words = item.data.words.map(word =>
            this.renderer.render(this.templateText, {
                text: TransformationUtils.prepareString(word)
            })
        );
        const answers = item.data.answers.map(answer =>
            this.renderer.render(this.templateText, {
                text: TransformationUtils.prepareString(answer)
            })
        );
        return this.renderer.render(template, { answers, words });
    }
}
