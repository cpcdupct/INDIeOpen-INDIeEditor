/* eslint-disable prefer-spread */
import { Migration, MigrationUtils } from '../Migrator';

/**
 * Migration from version 3 to version 4.
 *
 * Changes: Help parameter added to needed widgets.
 */
export class Migration3To4 implements Migration {
    currentVersion = 3;
    targetVersion = 4;

    run(sections: any[]): any[] {
        const widgetInstances = this.getWidgetsToAddHelpParameter(sections);
        for (const widgetInstance of widgetInstances) {
            widgetInstance.params.help = '';
        }

        return sections;
    }

    private getWidgetsToAddHelpParameter(sections: any[]): any[] {
        let widgetInstances = [];

        for (const section of sections) {
            const instancesInSection = this.findHelpInstances(section);
            widgetInstances = widgetInstances.concat(instancesInSection);
        }

        return widgetInstances;
    }

    private findHelpInstances(element: any) {
        let widgetInstances = [];

        if (this.isHelpWidget(element.widget)) {
            widgetInstances.push(element);
        }

        if (MigrationUtils.hasChildren(element.type)) {
            const childrenElements =
                element.type === 'layout' ? [].concat.apply([], element.data) : element.data;

            for (const child of childrenElements) {
                const instancesInChildren = this.findHelpInstances(child);
                widgetInstances = widgetInstances.concat(instancesInChildren);
            }
        }

        return widgetInstances;
    }

    private isHelpWidget(widget: any): boolean {
        return (
            [
                'AcordionContainer',
                'AnimationContainer',
                'AudioTermContainer',
                'ChooseOption',
                'CouplesContainer',
                'DragdropContainer',
                'Image',
                'ImageAndSoundContainer',
                'ImageAndText',
                'Modal',
                'SchemaContainer',
                'TabsContainer',
                'Test',
                'TrueFalseContainer'
            ].indexOf(widget) >= 0
        );
    }
}
