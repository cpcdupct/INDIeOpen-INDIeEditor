/* eslint-disable @typescript-eslint/quotes */
import { TransformationUtils } from '../../../services/TransformationUtils';
import { Rule, RuleContext } from '../Transform';

import { AbstractRule } from './AbstractRule';

export class PuzzleRule extends AbstractRule implements Rule {
    widget = 'Puzzle';

    private templateWithoutParent =
        "Widget '{{{name}}}': Puzzle { help '{{{help}}}', { background:  Image { url '{{{image}}}', alt '{{{alt}}}', Original }, pieces: [{{{pieces}}}] }}";
    private templateWithParent =
        "row { column { width '12' " + this.templateWithoutParent + ' } } ';

    private templatePiece =
        "{ x: Int{ {{{x}}} }, y: Int{ {{{y}}} }, wdth: Int{ {{{w}}} }, height: Int{ {{{h}}} }, altImg: Text{ html '{{{altImg}}}'}, altRec: Text{ html '{{{altRec}}}' } }";

    do(element: any, parent: any, context: RuleContext): string {
        const template =
            parent.type === 'section-container'
                ? this.templateWithParent
                : this.templateWithoutParent;
        const pieces = element.data.pieces.map(piece => this.getPiece(piece, context));
        return this.renderer.render(template, {
            pieces,
            name: TransformationUtils.prepareString(element.params.name),
            help: TransformationUtils.prepareString(element.params.help),
            alt: TransformationUtils.prepareString(element.data.alt),
            image: element.data.image
        });
    }

    private getPiece(piece: any, context: RuleContext): any {
        return this.renderer.render(this.templatePiece, {
            altImg: TransformationUtils.prepareString(piece.altImg),
            altRec: TransformationUtils.prepareString(piece.altRec),
            x: Math.round(piece.x),
            y: Math.round(piece.y),
            w: Math.round(piece.w),
            h: Math.round(piece.h)
        });
    }
}
