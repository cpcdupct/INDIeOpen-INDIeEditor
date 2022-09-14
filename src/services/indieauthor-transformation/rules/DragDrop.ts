import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../../indieauthor-transformation/Transform';

import { AbstractRule } from './AbstractRule';

export class DragAndDropContainerRule extends AbstractRule implements Rule {
    widget = 'DragdropContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': TextualDragAndDrop { help '{{{help}}}', [ {{{terms}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;

        const terms = [];

        for (const termDef of element.data) {
            terms.push(this.getDragDropItem(termDef));
        }

        return this.renderer.render(template, {
            terms,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getDragDropItem(item: any): string {
        return this.renderer.render(
            "{ term: Text { html '{{{term}}}' }, definition: Text { html '{{{definition}}}' } }",
            {
                term: TransformationUtils.prepareString(item.data.term),
                definition: TransformationUtils.prepareString(item.data.definition)
            }
        );
    }
}
