/* eslint-disable @typescript-eslint/quotes */
import { TranslationService } from '../../services/translation-service/TranslationService';
import { TransformationUtils } from '../../services/TransformationUtils';
import { HandlebarsRenderer } from '../handlebars-renderer/HandlebarsRenderer';
import {
    AcordionContainerRule,
    AcordionContentRule,
    AnimationContainerRule,
    AudioTermContainerRule,
    BlockquoteRule,
    ChooseOptionRule,
    ColumnLayoutRule,
    CouplesContainerRule,
    DragAndDropContainerRule,
    ImageAndSoundRule,
    ImageAndTextRule,
    ImageRule,
    InteractiveVideoRule,
    LatexFormulaRule,
    ModalRule,
    SchemaContainerRule,
    SectionRule,
    SimpleImageRule,
    TabContentRule,
    TabsContainerRule,
    TestRule,
    TextBlockRule,
    TrueFalseContainerRule,
    VideoRule,
    PuzzleRule,
    CorrectWordRule,
    MissingWordsRule,
    SentenceOrderRule,
    GuessWordRule,
    ButtonTextRule,
    AnimationRule,
    TermClassificationRule
} from '../indieauthor-transformation/rules/Rules';
import { TransformationInfo, TransformationMode } from '../../models/ModelEditor';

/**
 * Context that rules share
 */
export interface RuleContext {
    /** Language of the transformation */
    language?: string;
}

/**
 * Rule in Content Transformation
 */
export interface Rule {
    /** Rule applied to a widget */
    widget: string;
    /**
     * Get the transformation of a widget
     *
     * @param element Widget instance
     * @param parent Widget parent of the widget instance
     * @param context Rule context
     */
    do(element: any, parent: any, context?: RuleContext): string;
}

/**
 * Class that handles the content transformation
 */
export class ContentTransformation {
    /** Info about the author that requested the transformation */
    private info: TransformationInfo;
    /** Editor model instance */
    private model: any[];
    /** Rules container for transformation */
    private ruleContainer: RuleContainer;
    /** Handlebars renderer */
    private renderer: HandlebarsRenderer;

    constructor(info: TransformationInfo, model: any[]) {
        this.info = info;
        this.model = model;
        this.renderer = HandlebarsRenderer.getInstance();
        this.ruleContainer = RuleContainer.getInstance();
    }

    /**
     * Run the content transformation and return the resulting string
     */
    public runTransformation(): string {
        const sections = [];
        for (const editorSection of this.model) {
            sections.push(
                this.ruleContainer
                    .rule('Section')
                    .do(editorSection, {}, { language: this.info.language })
            );
        }

        return this.rootElement(sections);
    }

    private rootElement(sections: any[]): string {
        const rootTemplate =
            "ContentDefinition '{{unitName}}' { package upctforma.{{unitName}};  {{{types}}}  Unit '{{{unitLabel}}}' '{{{unitAuthor}}}' {{{mode}}} {{{language}}} {{{license}}} '{{{email}}}' '{{{institution}}}' '{{{theme}}}' '{{{resourceId}}}' {{analytics}} { {{{unitContent}}} } }";

        const types =
            'types{ TextType, VideoType, ImageType, GameType, IntType, Any, Tab{ name: TextType, content: ContentGroup }, DragAndDrop{ name: ImageType, content: ImageType, solution: ImageType }, DragAndDropTextual{ term: TextType, definition: TextType }, ContentGroup { list_of Any }, TabList { list_of Tab}, ImageList{list_of ImageType}, DragAndDropList{list_of DragAndDrop}, TextualDragAndDropList{list_of DragAndDropTextual}, widget ImageTextOver{ ImageType, TextType }, widget ImageTextRight{ ImageType, TextType }, widget VerticalAccordion{ TabList }, widget HorizontalTabs{ TabList }, Animation{ awidht: TextType, background: ImageType, images: ImageList, aheight: TextType }, widget AnimationInOut{ Animation }, widget RectangleDragAndDrop{ DragAndDropList }, widget TextualDragAndDrop{ TextualDragAndDropList }, AudioTerm { URL : TextType, term: TextType, definition: TextType, textTracks: TextType }, AudioTermList { list_of AudioTerm }, widget ContainerAudioTerm { AudioTermList }, ResponseList{ list_of TextType }, Test { question: TextType, response: ResponseList, correct: IntType, positiveFeedback: TextType, negativeFeedback: TextType }, TestList { list_of Test }, widget ContainerTest { TestList }, ChooseOptionRecord { questionText: TextType, questionImage: ImageType, response1: TextType, response2: TextType, response3: TextType, response4: TextType, correct: IntType }, widget ChooseOption { ChooseOptionRecord }, ImageSoundRecord { contentText: TextType, contentImage: ImageType, sound: TextType, textTracks: TextType }, ImageSoundList { list_of ImageSoundRecord }, widget ImageSound { ImageSoundList }, CouplesRecord { contentText: TextType, contentImage: ImageType }, CouplesList { list_of CouplesRecord }, widget Couples { CouplesList }, ListSchema { list_of ImageType }, widget Schema { ListSchema }, ModalRecord { name: TextType, content: ContentGroup }, widget ModalButton { ModalRecord }, TrueFalse { question: TextType, correct: TextType, positiveFeedback: TextType, negativeFeedback: TextType }, TrueFalseList { list_of TrueFalse }, widget ContainerTrueFalse { TrueFalseList }, TextList { list_of TextType }, ColumnRecord { heading: TextType, content: TextList}, ColumnsList { list_of ColumnRecord },widget MatchColumns { ColumnsList },PuzzlePiece {x: IntType,y: IntType,wdth: IntType,hght: IntType,altImg: TextType,altRec: TextType},PuzzlePiecesContainer { list_of PuzzlePiece },PuzzleContainer { background: ImageType, pieces: PuzzlePiecesContainer },widget Puzzle { PuzzleContainer },widget Animation { PuzzleContainer },MissingSolutions { list_of TextType },MissingSentence {sentence: TextType, combinations: MissingSolutions },MissingSentencesList { list_of MissingSentence },widget MissingWords { MissingSentencesList },CorrectWordRecord { question: TextType, image: ImageType, answer: TextType },CorrectWordRecords { list_of CorrectWordRecord },widget CorrectWord {CorrectWordRecords},ButtonTextRecord { image: ImageType, text: TextType},ButtonTextList { list_of ButtonTextRecord },widget ButtonText { ButtonTextList },SentenceOrderWordList { list_of TextType },SentenceOrderSolutionList { list_of TextType },SentenceOrderRecord { solutions: SentenceOrderSolutionList, words: SentenceOrderWordList },SentenceOrderContainer { list_of SentenceOrderRecord },widget SentenceOrder { SentenceOrderContainer },HangmanRecord { question: TextType, solution: TextType, attempts: IntType },widget Hangman { HangmanRecord } }';

        return this.renderer.render(rootTemplate, {
            unitName: 'UD',
            mode: this.info.mode,
            unitLabel: TransformationUtils.prepareString(this.info.title),
            unitAuthor: TransformationUtils.prepareString(this.info.user),
            language: this.info.language.toUpperCase(),
            unitContent: sections,
            email: this.info.email,
            license: this.info.license,
            institution: TransformationUtils.prepareString(this.info.institution),
            types,
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

export class RuleContainer {
    /** RuleContainer instance */
    private static instance: RuleContainer;

    /** Transformation rules */
    private rules: Rule[] = [];

    private constructor() {
        this.rules.push(
            new AcordionContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new AcordionContentRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new AnimationContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new AudioTermContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new BlockquoteRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ChooseOptionRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ColumnLayoutRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new CouplesContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new DragAndDropContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ImageRule(this, HandlebarsRenderer.getInstance(), TranslationService.getInstance()),
            new ImageAndSoundRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ImageAndTextRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new InteractiveVideoRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new LatexFormulaRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ModalRule(this, HandlebarsRenderer.getInstance(), TranslationService.getInstance()),
            new SchemaContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new SectionRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new SimpleImageRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new TabContentRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new TabsContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new TestRule(this, HandlebarsRenderer.getInstance(), TranslationService.getInstance()),
            new TextBlockRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new TrueFalseContainerRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new VideoRule(this, HandlebarsRenderer.getInstance(), TranslationService.getInstance()),
            new PuzzleRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new CorrectWordRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new MissingWordsRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new SentenceOrderRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new GuessWordRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new ButtonTextRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new AnimationRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            ),
            new TermClassificationRule(
                this,
                HandlebarsRenderer.getInstance(),
                TranslationService.getInstance()
            )
        );
    }

    /**
     * Gets the RuleContainer singleton instance or creates it if it does not exist
     */
    public static getInstance(): RuleContainer {
        if (!RuleContainer.instance) {
            RuleContainer.instance = new RuleContainer();
        }

        return RuleContainer.instance;
    }

    /**
     * Get a rule associated with a widget
     *
     * @param widgetName  Name of the widget in the rule
     */
    rule(widgetName: string): Rule {
        return this.rules.find(r => r.widget === widgetName);
    }
}
