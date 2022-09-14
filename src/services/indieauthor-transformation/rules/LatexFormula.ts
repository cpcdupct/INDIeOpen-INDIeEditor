import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class LatexFormulaRule extends AbstractRule implements Rule {
    widget = 'LatexFormula';

    private templateWithoutParent = "Text { html '{{{caption}}} $${{{formula}}}$$ '} ";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        // FIX \ must be translated into \\
        const formula = TransformationUtils.prepareFormula(element.data.formula);

        return this.renderer.render(template, {
            caption: TransformationUtils.prepareString(element.data.caption),
            formula
        });
    }
}
