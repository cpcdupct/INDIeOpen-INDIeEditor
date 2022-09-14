import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class InteractiveVideoRule extends AbstractRule implements Rule {
    widget = 'InteractiveVideo';

    private templateWithParent =
        "row {column { width '12' Video { id '{{{videourl}}}', title '{{{name}}}', type Interactive } } } ";
    private templateWithoutParent =
        "Video { id '{{{videourl}}}', title '{{{name}}}', type Interactive } ";

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        return this.renderer.render(template, {
            videourl: element.data.videourl,
            name: TransformationUtils.prepareString(element.params.name)
        });
    }
}
