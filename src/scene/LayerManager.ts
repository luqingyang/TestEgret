/**
 * Created by china on 2015/5/23.
 */
module game
{
    export class LayerManager extends egret.DisplayObjectContainer
    {
        public uiLayer: egret.gui.UIStage;
        public sceneLayer: egret.DisplayObjectContainer;

        public CreateLayer(): void
        {

            this.sceneLayer = new egret.DisplayObjectContainer;
            this.addChild(this.sceneLayer);

            var bitMap: egret.Bitmap = new egret.Bitmap;
            bitMap.texture = RES.getRes("bgImage");
            this.sceneLayer.addChild(bitMap);


            this.uiLayer = new egret.gui.UIStage();
            this.addChild(this.uiLayer);
        }
    }
}