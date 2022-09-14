import { Rule } from '../Transform';
import { TransformationUtils } from '../../../services/TransformationUtils';
import {
    TermClassification,
    TermClassificationItem
} from '../../../services/widgets/TermClassification';

import { AbstractRule } from './AbstractRule';

export class TermClassificationRule extends AbstractRule implements Rule {
    widget = 'TermClassification';

    private templateWithoutParent = `Widget '{{{name}}}': MatchColumns { help '{{{help}}}', [{{{terms}}}] } `;
    private templateWithParent = `row { column { width '12' ${this.templateWithoutParent}} } `;

    do(element: any, parent: any): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        const terms: string[] = [];

        const termClassification = element as TermClassification;

        for (const item of termClassification.data) {
            terms.push(this.getItem(item));
        }

        return this.renderer.render(template, {
            terms,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: TermClassificationItem): string {
        const template = `{ heading: Text { html '{{{column}}}' }, content: [{{{terms}}}] }`;

        const terms = item.data.terms.map(term => {
            return `Text { html '${TransformationUtils.prepareString(term)}'}`;
        });

        return this.renderer.render(template, {
            column: TransformationUtils.prepareString(item.data.column),
            terms
        });
    }
}
