import { Logger } from '@overnightjs/logger';

/** Class that handles the video transformation into interactive video data */
export class VideoTransform {
    /** Video Editor data */
    private editorData: any[];
    /** Time regular expression */
    private markTimeMatcher = new RegExp(/([0-9]*[0-9]):([0-5][0-9]):([0-9]{3})/g);

    constructor(editorData: any[]) {
        this.editorData = editorData;
    }

    /**
     * Run the video transformation to obtain the interactive data
     */
    public runTransformation(): any[] {
        try {
            const dataForIA: any[] = [];
            this.findAndPushLoops(dataForIA, this.editorData[0]);
            this.copyLoop(dataForIA, this.editorData[0]);
            return dataForIA;
        } catch (err) {
            Logger.Err(err);
            return [];
        }
    }

    /**
     * Creates the root loop and its children and appends it to the interactive data from the editor data
     *
     * @param dataForIA Interactive data
     * @param currentElement Current editor element
     */
    private findAndPushLoops(dataForIA, currentElement) {
        const loop: any = {};
        loop.id = currentElement.id;
        loop.type = 'loop';
        loop.start = this.fromTimeMark(currentElement.data.start);
        loop.end = this.fromTimeMark(currentElement.data.end);
        loop.options = [];

        if (currentElement.data.text) {
            loop.text = {
                content: currentElement.data.text
            };
        }

        dataForIA.push(loop);

        for (const child of currentElement.children) {
            if (child.type === 'loop') this.findAndPushLoops(dataForIA, child);
        }
    }

    /**
     * Copy the loops options into loop elements
     *
     * @param dataForIA Interactive data
     * @param currentElement Current loop element
     */
    private copyLoop(dataForIA, currentElement) {
        const loop = this.findObjectInArray(dataForIA, 'id', currentElement.id);
        // Copy options
        for (const element of currentElement.children) {
            if (element.type === 'loop')
                this.copyOption(
                    element,
                    loop,
                    this.findIndexObjectInArray(dataForIA, 'id', element.id)
                );
            else this.copyOption(element, loop, -1);
        }

        // Copy loops
        for (const element of currentElement.children) {
            if (element.type === 'loop') this.copyLoop(dataForIA, element);
        }
    }

    /**
     * Copy the loop options into the loop element
     *
     * @param currentElement Loop element
     * @param parent Loop parent
     * @param nextQuestion Next question
     */
    private copyOption(currentElement, parent, nextQuestion) {
        const option: any = {};

        option.start = this.fromTimeMark(currentElement.data.start);
        option.end = this.fromTimeMark(currentElement.data.end);
        option.type = 'option';

        option.sizes = {
            left: currentElement.data.coordinates[0][0],
            top: currentElement.data.coordinates[0][1],
            width: currentElement.data.coordinates[0][2],
            height: currentElement.data.coordinates[0][3]
        };

        if (currentElement.data.text) {
            option.text = {
                content: currentElement.data.text
            };
        }

        option.nextQuestion = nextQuestion;
        parent.options.push(option);
    }

    /**
     * Parse a time mark from the editor into interactive data time
     *
     * @param markTime Editor timemark
     */
    private fromTimeMark(markTime) {
        const groups = this.parseFromRegex(markTime);
        return parseFloat(groups.minutes * 60 + groups.seconds + '.' + groups.miliseconds);
    }

    /**
     * Uses the regex to parse the timemark
     *
     * @param markTime timemark
     */
    private parseFromRegex(markTime) {
        let minutes = 0;
        let seconds = 0;
        let miliseconds = 0;
        let match;

        while ((match = this.markTimeMatcher.exec(markTime))) {
            minutes = parseInt(match[1]);
            seconds = parseInt(match[2]);
            miliseconds = parseInt(match[3]);
        }

        return {
            minutes,
            seconds,
            miliseconds
        };
    }

    /**
     * Util function to find an index object in an array
     *
     * @param array Array of objects
     * @param key Property key of the object
     * @param value Value of property
     */
    private findIndexObjectInArray(array, key, value) {
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            if (element[key] === value) return i;
        }

        return -1;
    }

    /**
     * Util function to find an object in an array
     *
     * @param array Array of objects
     * @param key Property key of the object
     * @param value Value of property
     */
    private findObjectInArray(array, key, value) {
        const index = this.findIndexObjectInArray(array, key, value);
        if (index !== -1) return array[index];
        return undefined;
    }
}
