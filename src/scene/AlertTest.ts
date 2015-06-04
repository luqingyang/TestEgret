/**
 * Created by china on 2015/5/25.
 */
module  game{
    export  class AlertTest extends egret.gui.SkinnableComponent {
        public constructor(){
            super();
            this.skinName = "skins.simple.AlertSkin";
        }

        public firstButton:egret.gui.Button;
        public contentDisplay: egret.gui.Label;
        public partAdded(partName: string, instance: any): void
        {
            super.partAdded(partName, instance);
            if (instance == this.firstButton)
            {
                this.firstButton.addEventListener(egret.TouchEvent.TOUCH_TAP, this.clickHandler, this);
            }
            else if (instance == this.contentDisplay)
            {
                this.contentDisplay.text = "function";
            }

        }

        private clickHandler(): void{
            egret.gui.Alert.show("this is an alert message!", "Alert");
            //if (this.parent)
            //    (<egret.gui.UIStage>this.parent).removeElement(this);
        }
    }
}
