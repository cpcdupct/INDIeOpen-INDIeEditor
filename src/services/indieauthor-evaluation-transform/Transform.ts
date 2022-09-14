import { TransformationInfo, TransformationMode } from '../../models/ModelEditor';
import { HandlebarsRenderer } from '../../services/handlebars-renderer/HandlebarsRenderer';
import { TransformationUtils } from '../../services/TransformationUtils';

import { MultipleAnswerRule, SingleAnswerRule, TrueFalseRule } from './rules/Rules';

/**
 * Evaluation transformation rule
 */
export interface Rule {
    /** Question type  */
    type: string;
    /** Transform a question model into a string element of the transformation */
    do(question: any): string;
}

/**
 * Class that handles the transformation of an evaluation unit
 */
export class EvaluationTransform {
    /** Info about the author that requested the transformation */
    private info: TransformationInfo;
    /** Editor model instance */
    private questions: any[];
    /** Rules container for transformation */
    private ruleContainer: RuleContainer;
    /** Handlebars renderer */
    private renderer: HandlebarsRenderer;

    constructor(info: TransformationInfo, questions: any[]) {
        this.info = info;
        this.questions = questions;
        this.renderer = HandlebarsRenderer.getInstance();
        this.ruleContainer = RuleContainer.getInstance();
    }

    /**
     * Run the transformation engine and returns the result in a string
     */
    public runTransformation(): string {
        const questionsContent = [];

        for (const question of this.questions) {
            questionsContent.push(this.ruleContainer.rule(question.type).do(question));
        }

        const rootTemplate =
            // eslint-disable-next-line @typescript-eslint/quotes
            "Evaluation '{{{name}}}' { package upctformaevalua.evaluation; Final '{{{name}}}' '{{author}}' {{{mode}}} {{{language}}} {{{license}}} '{{{email}}}' '{{{institution}}}' '{{{theme}}}' '{{{resourceId}}}' {{analytics}} { questions { {{{questions}}} } } }";
        return this.renderer.render(rootTemplate, {
            name: TransformationUtils.prepareString(this.info.title),
            questions: questionsContent,
            author: TransformationUtils.prepareString(this.info.user),
            mode: this.info.mode,
            language: this.info.language.toUpperCase(),
            email: this.info.email,
            license: this.info.license,
            institution: TransformationUtils.prepareString(this.info.institution),
            theme: this.info.theme,
            resourceId:
                this.info.mode === TransformationMode.PREVIEW ? 'preview' : this.info.resourceId,
            analytics:
                this.info.mode === TransformationMode.INTEROPERABILITY && this.info.analytics
                    ? 1
                    : 0
        });
    }
}

/**
 * Class that handles the evaluation transformation rule container
 */
export class RuleContainer {
    /** RuleContainer instance */
    private static instance: RuleContainer;

    /** Transformation rules */
    private rules: Rule[] = [];

    private constructor() {
        this.rules.push(new TrueFalseRule(), new SingleAnswerRule(), new MultipleAnswerRule());
    }

    /** Get the RuleContainer singleton instance */
    public static getInstance(): RuleContainer {
        if (!RuleContainer.instance) {
            RuleContainer.instance = new RuleContainer();
        }

        return RuleContainer.instance;
    }

    /**
     * Finds a rule with a question type associated
     *
     * @param questionType Type of question
     */
    rule(questionType: string): Rule {
        return this.rules.find(r => r.type === questionType);
    }
}
