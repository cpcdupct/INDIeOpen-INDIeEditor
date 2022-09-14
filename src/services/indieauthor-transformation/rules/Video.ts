/* eslint-disable @typescript-eslint/quotes */
import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class VideoRule extends AbstractRule implements Rule {
    widget = 'Video';

    private templateWithParent =
        "row {column { width '12' Video { id '{{{videourl}}}', title '{{{name}}}', type Normal, captions '{{{captions}}}', descriptions '{{{descriptions}}}' } } } ";
    private templateWithoutParent = `Video { id '{{{videourl}}}', title '{{{name}}}' , type Normal, captions '{{{captions}}}', descriptions '{{{descriptions}}}' } `;

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        let videourl = '';

        if (TransformationUtils.isYoutubeVideoURL(element.data.videourl)) {
            const youtubeId = TransformationUtils.getYoutubeId(element.data.videourl);
            const startTime = TransformationUtils.getYoutubeStartTime(element.data.videourl);
            videourl = 'https://www.youtube.com/embed/' + youtubeId + '?start=' + startTime;
        } else if (TransformationUtils.isIndieResource(element.data.videourl)) {
            videourl = this.removeIndieMediaFromUrl(element.data.videourl);
        }

        return this.renderer.render(template, {
            videourl,
            captions: element.data.captions ? element.data.captions : '',
            descriptions: element.data.descriptions ? element.data.descriptions : '',
            name: TransformationUtils.prepareString(element.params.name)
        });
    }

    private removeIndieMediaFromUrl(url: string) {
        return url.replace('https://my_multimedia_server?v=', '');
    }
}
