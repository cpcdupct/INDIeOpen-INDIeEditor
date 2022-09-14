/* eslint-disable @typescript-eslint/quotes */
import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ChooseOptionRule extends AbstractRule implements Rule {
    widget = 'ChooseOption';

    private templateWithoutParent =
        "Widget '{{{name}}}': ChooseOption { help '{{{help}}}', { questionText: Text{html '{{{text}}}' }, questionImage: Image { url '{{{image}}}', alt '{{{alt}}}', Original },{{#each answers}} response{{inc @index}}: Text{html '{{{text}}}' },{{/each}} correct: Int{ {{{correct}}} } } }";
    private templateWithParent: string =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        let correctIndex = 1;
        for (let i = 0; i < element.data.options.length; i++) {
            const subElement = element.data.options[i];
            subElement.text = TransformationUtils.prepareString(subElement.text);
            if (subElement.correct) correctIndex = i + 1;
        }
        return this.renderer.render(template, {
            text: TransformationUtils.prepareString(element.data.text),
            image: element.data.image,
            alt: TransformationUtils.prepareString(element.data.alt),
            answers: element.data.options,
            correct: correctIndex,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}
