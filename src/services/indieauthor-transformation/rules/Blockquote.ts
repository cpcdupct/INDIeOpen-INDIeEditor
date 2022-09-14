import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class BlockquoteRule extends AbstractRule implements Rule {
    widget = 'Blockquote';

    private templateWithoutParent =
        'Text { html \'<blockquote class="blockquote {{#ifeq alignment "left"}}blockquote-reverse text-left{{/ifeq}}"><p>{{{quote}}}</p><footer class="blockquote-footer">{{{caption}}} <cite title="{{{source}}}">{{{source}}}</cite></footer></blockquote>\' } ';
    private templateWithParent = "row {column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        return this.renderer.render(template, {
            alignment: element.data.alignment,
            quote: TransformationUtils.prepareString(element.data.quote),
            caption: TransformationUtils.prepareString(element.data.caption),
            source: TransformationUtils.prepareString(element.data.source)
        });
    }
}
