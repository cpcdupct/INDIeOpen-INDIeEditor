import { Migration } from '../Migrator';

/**
 * Migration from version 1 to version 2.
 *
 * Changes: Adds a Bookmark to the section
 */
export class Migration1To2 implements Migration {
    currentVersion = 1;
    targetVersion = 2;

    run(sections: any[]): any[] {
        const migratedSections = [];

        for (const section of sections) {
            section.bookmark = 's';
            migratedSections.push(section);
        }

        return migratedSections;
    }
}
