import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class TabsContainerRule extends AbstractRule implements Rule {
    widget = 'TabsContainer';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            "row { column { width '12' Widget '{{{name}}}' : HorizontalTabs { help '{{{help}}}', [ {{{tabs}}} ]} } } ";

        const tabsContent = [];

        for (const tabContainer of element.data) {
            tabsContent.push(this.rules.rule(tabContainer.widget).do(tabContainer, {}, context));
        }

        return this.renderer.render(template, {
            tabs: tabsContent,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }
}

export class TabContentRule extends AbstractRule implements Rule {
    widget = 'TabContent';

    do(element: any, parent: any, context: RuleContext): string {
        const template = "{ name: Text { html '<p>{{{name}}}</p>' }, content: [{{{elements}}}] } ";
        const elements = [];

        for (const tabElement of element.data) {
            elements.push(this.rules.rule(tabElement.widget).do(tabElement, element, context));
        }

        return this.renderer.render(template, {
            name: TransformationUtils.prepareString(element.params.name),
            elements
        });
    }
}
