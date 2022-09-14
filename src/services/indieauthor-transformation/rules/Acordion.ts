import { TransformationUtils } from '../../..../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class AcordionContainerRule extends AbstractRule implements Rule {
    widget = 'AcordionContainer';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            "row { column { width '12' Widget '{{{name}}}' : VerticalAccordion { help '{{{help}}}', [ {{{tabs}}} ]} } } ";
        const tabsContent = [];

        for (const acordionContent of element.data)
            tabsContent.push(
                this.rules.rule(acordionContent.widget).do(acordionContent, {}, context)
            );

        return this.renderer.render(template, {
            tabs: tabsContent,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}

export class AcordionContentRule extends AbstractRule implements Rule {
    widget = 'AcordionContent';

    do(element: any, parent: any, context: RuleContext): string {
        const template = "{ name: Text { html '{{{title}}}'} , content: [{{{elements}}}] } ";
        const elements = [];

        for (const acordionElement of element.data) {
            elements.push(
                this.rules.rule(acordionElement.widget).do(acordionElement, element, context)
            );
        }

        return this.renderer.render(template, {
            title: TransformationUtils.prepareString(element.params.title),
            elements
        });
    }
}
