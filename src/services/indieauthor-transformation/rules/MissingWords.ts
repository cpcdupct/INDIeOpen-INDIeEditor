/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../Utils';
import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class MissingWordsRule extends AbstractRule implements Rule {
    widget = 'MissingWords';

    private templateWithoutParent =
        "Widget '{{{name}}}': MissingWords { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';
    private templateCombination = "Text {html '{{{combination}}}'}";

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const missingWordsItem of element.data) {
            items.push(this.getItem(missingWordsItem));
        }
        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const template =
            "{ sentence: Text { html '{{{sentence}}}' }, combinations: [{{{combinations}}}] }";
        const combinations = item.data.combinations.map(combination =>
            this.renderer.render(this.templateCombination, {
                combination: TransformationUtils.prepareString(combination)
            })
        );
        return this.renderer.render(template, {
            sentence: TransformationUtils.prepareString(item.data.sentence),
            combinations
        });
    }
}
