import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class AudioTermContainerRule extends AbstractRule implements Rule {
    widget = 'AudioTermContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': ContainerAudioTerm { help '{{{help}}}', [{{{terms}}}] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const rootTemplate =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const terms = [];
        const items = element.data;

        for (const audioTermItem of items) {
            terms.push(this.getAudioItemContent(audioTermItem));
        }

        return this.renderer.render(rootTemplate, {
            terms,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getAudioItemContent(element: any): any {
        const template =
            "{ URL: Text { html '{{{audio}}}' }, term: Text { html '{{{term}}}' }, definition: Text { html '{{{definition}}}' }, textTracks: Text { html '{{{captions}}}' } }";

        return this.renderer.render(template, {
            audio: element.data.audio,
            captions: element.data.captions ? element.data.captions : '',
            term: TransformationUtils.prepareString(element.data.term),
            definition: TransformationUtils.prepareString(element.data.definition)
        });
    }
}
