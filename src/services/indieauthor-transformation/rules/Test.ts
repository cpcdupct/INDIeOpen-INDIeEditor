import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class TestRule extends AbstractRule implements Rule {
    widget = 'Test';

    private templateWithoutParent =
        "Widget '{{{name}}}': ContainerTest { help '{{{help}}}', [{{{terms}}}] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const rootTemplate =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const terms = [];
        const items = element.data;

        for (const questionItem of items) {
            terms.push(this.getQuestionContent(questionItem.data, questionItem.widget, context));
        }

        return this.renderer.render(rootTemplate, {
            terms,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getQuestionContent(question: any, type: string, context: RuleContext): string {
        const tempalte =
            "{ question: Text { html '{{{question}}}' }, response: [{{{answers}}}], correct: Int{ {{{correct}}} }, positiveFeedback: Text { html '{{{positive}}}' }, negativeFeedback: Text { html '{{{negative}}}' } }";
        const answers = [];
        let correct = 1;

        if (type === 'TrueFalseQuestion') {
            correct = question.answer ? 1 : 2;

            const trueAnswer = `Text { html '${this.translateString('true', context.language)}'}`;
            const falseAnswer = `Text { html '${this.translateString('false', context.language)}'}`;

            answers.push(trueAnswer);
            answers.push(falseAnswer);
        } else {
            for (let i = 0; i < question.answers.length; i++) {
                const answer = question.answers[i];
                answers.push(
                    this.renderer.render("Text { html '{{{text}}}' }", {
                        text: TransformationUtils.prepareString(answer.text)
                    })
                );
                if (answer.correct) correct = i + 1;
            }
        }

        return this.renderer.render(tempalte, {
            question: TransformationUtils.prepareString(question.question),
            answers,
            positive: TransformationUtils.prepareString(question.feedback.positive),
            negative: TransformationUtils.prepareString(question.feedback.negative),
            correct
        });
    }
}
