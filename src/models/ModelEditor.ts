/**
 * Content Type of the INDIe token model instance
 */
// eslint-disable-next-line no-shadow
export enum ContentType {
    CONTENT = 'CONTENT',
    EVALUATION = 'EVALUATION',
    VIDEO = 'VIDEO',
    COURSE = 'COURSE'
}

/**
 * Creative commons licenses available at INDIe
 */
// eslint-disable-next-line no-shadow
export enum CreativeCommons {
    PRIVATE = 'PRIVATE',
    BY = 'BY',
    BYSA = 'BYSA',
    BYND = 'BYND',
    BYNC = 'BYNC',
    BYNCSA = 'BYNCSA',
    BYNCND = 'BYNCND'
}

/**
 * Information abaout the model that the available editors at INDIe will need in order to provide functionality
 */
export interface ModelEditor {
    /** Type of the content in the model */
    type: ContentType;
    /** Name of the model */
    name: string;
    /** Author of the model */
    author: string;
    /** Email of the model author */
    email: string;
    /** Language used in the instance */
    language?: string;
    /** Model data */
    instance: any;
    /** Institution of the author */
    institution?: string;
    /** Creative Commons license applied to the model */
    license?: CreativeCommons;
    /** Mode that the model transformation will use */
    mode?: TransformationMode;
    /** Visual theme applied in the resource generation */
    theme?: string;
    /** Unidad del recurso */
    resourceId?: string;
    /** Analytics on/off  */
    analytics?: boolean;
}

/**
 * Transformation mode. A transformation can be done: Preview (no learning analytics involved),
 * Open (no learning analytics, open access), Interoperability (learning analytics and private access)
 */
// eslint-disable-next-line no-shadow
export enum TransformationMode {
    PREVIEW = 'Preview',
    OPEN = 'Open',
    INTEROPERABILITY = 'Interoperability'
}

/**
 * Information that the transformation will need in order to transform the model into a string or json data
 */
export interface TransformationInfo {
    /** Title of the model */
    title: string;
    /** Author of the model */
    user: string;
    /** Email of the author */
    email: string;
    /** Creative Commons license applied to the model */
    license: CreativeCommons;
    /** Institution of the author */
    institution: string;
    /** Language of the model */
    language: string;
    /** Mode that the model transformation will use */
    mode: TransformationMode;
    /** Visual theme applied in the resource generation */
    theme: string;
    /** Unidad del recurso */
    resourceId?: string;
    /** Analytics on/off  */
    analytics?: boolean;
}
