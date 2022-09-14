/* eslint-disable prefer-spread */
import { TranslationService } from '../../../services/translation-service/TranslationService';
import { Migration, MigrationInfo, MigrationUtils } from '../Migrator';

/**
 * Migration from version 5 to version 6.
 *
 * Changes: Background type and image deleted from sections.
 */
export class Migration5To6 implements Migration {
    currentVersion = 5;
    targetVersion = 6;

    private translationService: TranslationService;

    constructor(private migrationInfo: MigrationInfo) {
        this.translationService = TranslationService.getInstance();
    }

    run(sections: any[]): any[] {
        const widgetInstances = this.getWidgetsWithAnImageParameter(sections);
        for (const widgetInstance of widgetInstances) {
            widgetInstance.data.alt = this.translationService.translate(
                'alt',
                this.migrationInfo.language
            );
        }

        return sections;
    }

    private getWidgetsWithAnImageParameter(sections: any[]) {
        let widgetInstances = [];

        for (const section of sections) {
            const instancesInSection = this.findWidgetsWithImageParamter(section);
            widgetInstances = widgetInstances.concat(instancesInSection);
        }

        return widgetInstances;
    }

    private findWidgetsWithImageParamter(element: any) {
        let widgetInstances = [];

        if (this.isWidgetWithAnImage(element.widget)) {
            widgetInstances.push(element);
        }

        if (MigrationUtils.hasChildren(element.type)) {
            const childrenElements =
                element.type === 'layout' ? [].concat.apply([], element.data) : element.data;

            for (const child of childrenElements) {
                const instancesInChildren = this.findWidgetsWithImageParamter(child);
                widgetInstances = widgetInstances.concat(instancesInChildren);
            }
        }

        return widgetInstances;
    }

    private isWidgetWithAnImage(widget: any): boolean {
        return (
            [
                'ChooseOption',
                'CouplesItem',
                'Image',
                'ChooseOption',
                'ImageAndSoundItem',
                'ImageAndText',
                'SchemaItem',
                'SimpleImage'
            ].indexOf(widget) >= 0
        );
    }
}
