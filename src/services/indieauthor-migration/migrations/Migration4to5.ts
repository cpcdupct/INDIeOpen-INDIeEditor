import { Migration } from '../Migrator';

/**
 * Migration from version 4 to version 5.
 *
 * Changes: Background type and image deleted from sections.
 */
export class Migration4To5 implements Migration {
    currentVersion = 4;
    targetVersion = 5;

    run(sections: any[]): any[] {
        for (const section of sections) {
            delete section.backgroundType;
            delete section.image;
        }

        return sections;
    }
}
