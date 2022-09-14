/* eslint-disable prefer-spread */
import { Migration, MigrationUtils } from '../Migrator';

/**
 * Migration from version 6 to version 7.
 *
 * Changes: TrueFalse and GapTest questions -> Feedback added.
 */
export class Migration6To7 implements Migration {
    currentVersion = 6;
    targetVersion = 7;

    run(sections: any[]): any[] {
        const widgetInstances = MigrationUtils.findWidgets(sections, [
            'TrueFalseItem',
            'GapQuestion',
            'SimpleQuestion',
            'TrueFalseQuestion'
        ]);

        for (const widgetInstance of widgetInstances) {
            widgetInstance.data.feedback = {
                positive: '',
                negative: ''
            };
        }

        return sections;
    }
}
