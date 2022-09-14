import { Migration, MigrationUtils } from '../Migrator';

/**
 * Migration from version 7 to version 8
 *
 * Added captions to ImageAndSound and AudioTerm
 * Added captions and descriptions to Video
 */
export class Migration7To8 implements Migration {
    currentVersion = 7;
    targetVersion = 8;

    run(sections: any[]): any[] {
        const widgetInstances: any[] = MigrationUtils.findWidgets(sections, [
            'Video',
            'ImageAndSoundItem',
            'AudioTermItem'
        ]);

        for (const widgetInstance of widgetInstances) {
            widgetInstance.data.captions = '';
            if (widgetInstance.widget === 'Video') widgetInstance.data.descriptions = '';
        }

        return sections;
    }
}
