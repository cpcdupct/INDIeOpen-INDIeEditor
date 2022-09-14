import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule } from '../Transform';

import { AbstractRule } from './AbstractRule';

/**
 * Single answer question transformation rule
 */
export class SingleAnswerRule extends AbstractRule implements Rule {
    type = 'SingleAnswer';

    private template =
        'SingleAnswer { statement "{{{text}}}" answers { {{{answers}}} } correct {{{correct}}} correctfeedback "Correct" incorrectfeedback "Incorrect" }';

    do(question: any): string {
        return this.renderer.render(this.template, {
            text: TransformationUtils.prepareString(question.text),
            answers: this.getAnswers(question.answers),
            correct: this.getCorrect(question.answers)
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
            content.push('"' + TransformationUtils.prepareString(answer.text) + '"');
        }

        return content;
    }

    /**
     * Get the correct answer number
     *
     * @param answers Array of answers for the question
     */
    private getCorrect(answers: any[]): number {
        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            if (answer.correct) return i + 1;
        }

        return 0;
    }
}
