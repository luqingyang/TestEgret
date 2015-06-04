/**
 * Created by china on 2015/5/25.
 */
module game
{
    export  class BitmapLabelTest extends egret.gui.SkinnableContainer {
        public bitmapLabel : egret.gui.BitmapLabel;
        public constructor(){
            super();

            this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        }

        public onAddToStage(event: egret.Event): void{
            this.bitmapLabel = new egret.gui.BitmapLabel;
            this.bitmapLabel.text = "abc123";
            this.addElement(this.bitmapLabel);
            this.bitmapLabel.font = RES.getRes("font_fnt");
            this.bitmapLabel.padding = 50;
        }
    }
}