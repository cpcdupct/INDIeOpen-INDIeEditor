/* eslint-disable prefer-spread */
import { Migration, MigrationUtils } from '../Migrator';

/**
 * Migration from version 2 to version 3.
 *
 * Changes:
 * - Aspect param added to all SimpleImages and aspect parameter to params.
 * - GapTest type changed to Test
 */
export class Migration2To3 implements Migration {
    currentVersion = 2;
    targetVersion = 3;

    run(sections: any[]): any[] {
        // Add aspect param to all SimpleImages and add the aspect parameter to params
        const iamgesInstances = this.getWidgetInstancesByWidgetType(sections, 'SimpleImage');
        for (const widgetInstance of iamgesInstances) {
            widgetInstance.params.aspect = 'original';
        }

        // Get all GapTest instances and change the type to Test
        const gapTestInstances = this.getWidgetInstancesByWidgetType(sections, 'GapTest');
        for (const widgetInstance of gapTestInstances) {
            widgetInstance.widget = 'Test';
        }

        return sections;
    }

    private getWidgetInstancesByWidgetType(sections: any[], widgetType: string) {
        let widgetInstances = [];

        for (const section of sections) {
            const instancesInSection = this.findInstancesByWidgetType(section, widgetType);
            widgetInstances = widgetInstances.concat(instancesInSection);
        }

        return widgetInstances;
    }

    private findInstancesByWidgetType(element: any, widgetType: string) {
        let widgetInstances = [];

        if (element.widget === widgetType) {
            widgetInstances.push(element);
        }

        if (MigrationUtils.hasChildren(element.type)) {
            const childrenElements =
                element.type === 'layout' ? [].concat.apply([], element.data) : element.data;
            for (const child of childrenElements) {
                const instancesInChildren = this.findInstancesByWidgetType(child, widgetType);
                widgetInstances = widgetInstances.concat(instancesInChildren);
            }
        }

        return widgetInstances;
    }
}
