import { TransformationUtils } from '../../TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class AnimationContainerRule extends AbstractRule implements Rule {
    widget = 'AnimationContainer';

    private templateWithoutParent =
        "Widget '{{{name}}}': AnimationInOut { help '{{{help}}}', { awidth: Text{ html '{{{width}}}'},  background: Image { url '{{{completeImage}}}', alt ' ', Original }, imagelist: [ {{{images}}} ], aheight: Text { html '{{{height}}}'} } }";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const imageList = [];

        for (const imageElement of element.data) {
            imageList.push(this.getAnimationItem(imageElement));
        }

        return this.renderer.render(template, {
            width: element.params.width,
            height: element.params.height,
            completeImage: element.params.image,
            images: imageList,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help)
        });
    }

    private getAnimationItem(item: any) {
        const template = "Image { url '{{{image}}}', alt ' ', Original } ";

        return this.renderer.render(template, {
            image: item.data.image
        });
    }
}
