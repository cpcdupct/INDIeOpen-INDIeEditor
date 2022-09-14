import {
    Migration1To2,
    Migration2To3,
    Migration3To4,
    Migration4To5,
    Migration5To6,
    Migration6To7,
    Migration7To8,
    Migration8To9
} from './migrations';

/**
 * Migration information
 */
export interface MigrationInfo {
    /** Number of version */
    version: number;
    /** Sections */
    sections: any[];
    /** Language */
    language: string;
}

/**
 * Migration interface for migrating between versions of the content model
 */
export interface Migration {
    /** Current model version  */
    currentVersion: number;
    /** Target model version */
    targetVersion: number;
    /** Run migration process */
    run(sections: any[]): any[];
}

/**
 * Class that handles the content unit migration: from the initial to the latest model version
 */
export class Migrator {
    /** Current model version. Must match with the last element in versionHistory */
    public static currentVersion = 9;

    /** Array of version numbers */
    private versionHistory: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    /** Current migration info instance */
    private migrationInfo: MigrationInfo;

    /** Container of migration instances */
    private migrationContainer: MigrationContainer;

    constructor(migrationInfo: MigrationInfo) {
        this.migrationInfo = migrationInfo;
        this.migrationContainer = new MigrationContainer(migrationInfo);
    }

    /**
     * Returns wether a model needs to be migrated to the latest version.
     *
     * @param version Current model version
     */
    public static migrationNeeded(version: number): boolean {
        return version < Migrator.currentVersion;
    }

    /** Run the migration process and return the array of sections */
    public runMigrations(): any[] {
        const indexOfModelVersion = this.versionHistory.indexOf(this.migrationInfo.version);
        let sections = this.migrationInfo.sections;

        for (
            let i = indexOfModelVersion;
            i < this.versionHistory.length && i + 1 < this.versionHistory.length;
            i++
        ) {
            const currentVersion = this.versionHistory[i];
            const targetVersion = this.versionHistory[i + 1];

            sections = this.migrationContainer
                .getMigration(currentVersion, targetVersion)
                .run(sections);
        }

        return sections;
    }
}
/**
 * Class that contains the migrations
 */
export class MigrationContainer {
    /** Array of migrations */
    private migrations: Migration[] = [];

    constructor(migrationInfo: MigrationInfo) {
        this.migrations.push(
            new Migration1To2(),
            new Migration2To3(),
            new Migration3To4(),
            new Migration4To5(),
            new Migration5To6(migrationInfo),
            new Migration7To8(),
            new Migration6To7(),
            new Migration8To9()
        );
    }

    /**
     * Find a migration with current and target version specified
     *
     * @param currentVersion Current version
     * @param targetVersion Target version
     */
    getMigration(currentVersion: number, targetVersion: number): Migration {
        return this.migrations.find(
            m => m.targetVersion === targetVersion && m.currentVersion === currentVersion
        );
    }
}

/** Migration function utils */
export class MigrationUtils {
    /**
     * Return wether an element type has children
     *
     * @param elementType element type
     */
    public static hasChildren(elementType: string) {
        return (
            elementType === 'specific-container' ||
            elementType === 'simple-container' ||
            elementType === 'specific-element-container' ||
            elementType === 'element-container' ||
            elementType === 'layout' ||
            elementType === 'section-container'
        );
    }

    public static findWidgets(sections: any[], widgetNames: string[]): any[] {
        let widgetInstances = [];

        for (const section of sections) {
            const instancesInSection = this.findWidgetsInSection(section, widgetNames);
            widgetInstances = widgetInstances.concat(instancesInSection);
        }

        return widgetInstances;
    }

    private static findWidgetsInSection(element: any, widgetNames: string[]) {
        let widgetInstances = [];

        if (widgetNames.includes(element.widget)) {
            widgetInstances.push(element);
        }

        if (MigrationUtils.hasChildren(element.type)) {
            const childrenElements =
                // eslint-disable-next-line prefer-spread
                element.type === 'layout' ? [].concat.apply([], element.data) : element.data;

            for (const child of childrenElements) {
                const instancesInChildren = MigrationUtils.findWidgetsInSection(child, widgetNames);
                widgetInstances = widgetInstances.concat(instancesInChildren);
            }
        }

        return widgetInstances;
    }
}
