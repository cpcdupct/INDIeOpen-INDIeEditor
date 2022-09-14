import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ColumnLayoutRule extends AbstractRule implements Rule {
    widget = 'ColumnLayout';

    do(element: any, parent: any, context: RuleContext): string {
        const template = 'row { {{{columns}}} } ';
        const columnSize = 12 / element.params.columns;
        const columns = [];

        for (let i = 0; i < element.params.columns; i++) {
            const subArray = element.data[i];
            const columnContent = "column { width '{{{columnSize}}}' {{{elements}}} }";
            const elements = [];

            for (const subElement of subArray) {
                elements.push(this.rules.rule(subElement.widget).do(subElement, element, context));
            }

            columns.push(
                this.renderer.render(columnContent, {
                    columnSize,
                    elements
                })
            );
        }

        return this.renderer.render(template, {
            columns
        });
    }
}
