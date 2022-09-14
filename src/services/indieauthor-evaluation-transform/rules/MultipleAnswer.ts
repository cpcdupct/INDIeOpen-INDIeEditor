import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule } from '../Transform';

import { AbstractRule } from './AbstractRule';

/**
 * Multiple answer question transformation rule
 */
export class MultipleAnswerRule extends AbstractRule implements Rule {
    type = 'MultipleAnswer';

    private template =
        "MultipleAnswer { statement '{{{text}}}' answers { {{{answers}}} } correctfeedback 'Correct' incorrectfeedback 'Incorrect' }";

    do(question: any): string {
        return this.renderer.render(this.template, {
            text: TransformationUtils.prepareString(question.text),
            answers: this.getAnswers(question.answers)
        });
    }

    /**
     * Get transformed answers in a string
     *
     * @param answers Array of answers for the question
     */
    private getAnswers(answers: any[]): string[] {
        const content = [];
        for (const answer of answers) {
            content.push(
                "{ '" +
                    TransformationUtils.prepareString(answer.text) +
                    "', " +
                    answer.correct +
                    '}'
            );
        }

        return content;
    }
}
