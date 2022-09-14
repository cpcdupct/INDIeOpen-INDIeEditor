import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule } from '../Transform';

import { AbstractRule } from './AbstractRule';

/**
 * True/false answer question transformation rule
 */
export class TrueFalseRule extends AbstractRule implements Rule {
    type = 'TrueFalse';

    private template =
        "TrueOrFalse { assertions { { '{{{text}}}', {{{correct}}} } } correctfeedback 'Correct' incorrectfeedback 'Incorrect' }";

    do(question: any): string {
        return this.renderer.render(this.template, {
            text: TransformationUtils.prepareString(question.text),
            correct: question.correct
        });
    }
}
