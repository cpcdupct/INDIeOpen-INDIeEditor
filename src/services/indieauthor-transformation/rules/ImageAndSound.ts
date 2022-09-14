/* eslint-disable @typescript-eslint/quotes */
import { Utils } from '../../../services/Utils';
import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class ImageAndSoundRule extends AbstractRule implements Rule {
    widget = 'ImageAndSoundContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': ImageSound { help '{{{help}}}', [ {{{items}}} ] }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const items = [];

        for (const imageSoundItem of element.data) {
            items.push(this.getItem(imageSoundItem));
        }

        return this.renderer.render(template, {
            items,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getItem(item: any): any {
        const template =
            "{ sound: Text { html '{{{audio}}}' }, contentImage: Image { url '{{{image}}}', alt '{{{alt}}}', Original }, contentText: Text { html '{{{text}}}'}, textTracks: Text { html '{{{captions}}}' } }";
        return this.renderer.render(template, {
            audio: item.data.audio,
            image: item.data.image,
            captions: item.data.captions ? item.data.captions : '',
            alt: TransformationUtils.prepareString(item.data.alt),
            text: !Utils.isStringEmptyOrWhitespace(item.data.text)
                ? TransformationUtils.prepareString(item.data.text)
                : ''
        });
    }
}
