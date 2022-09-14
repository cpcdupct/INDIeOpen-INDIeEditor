import { Migration, MigrationUtils } from '../Migrator';

/**
 * Migration from version 8 to version 9
 *
 * Widget couples can contain now both images and text in each element.
 */
export class Migration8To9 implements Migration {
    currentVersion = 8;
    targetVersion = 9;

    run(sections: any[]): any[] {
        const widgetInstances: any[] = MigrationUtils.findWidgets(sections, ['CouplesItem']);
        for (const widgetInstance of widgetInstances) {
            if (widgetInstance.data.image && widgetInstance.data.alt && widgetInstance.data.text) {
                widgetInstance.data.couples = [];
                widgetInstance.data.couples[0] = {
                    type: 'image',
                    image: widgetInstance.data.image,
                    alt: widgetInstance.data.alt,
                    text: ''
                };
                widgetInstance.data.couples[1] = {
                    type: 'text',
                    image: '',
                    alt: '',
                    text: widgetInstance.data.text
                };
                delete widgetInstance.data.image;
                delete widgetInstance.data.alt;
                delete widgetInstance.data.text;
            }
        }

        return sections;
    }
}
