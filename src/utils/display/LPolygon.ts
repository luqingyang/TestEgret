/**
 * Created by d8q8 on 2014/8/15.
 * @module lcp
 * @class LPolygon
 * @constructor
 **/
module lcp{
    /**
     * 绘制多边形
     */
    export class LPolygon extends LGraphics{
        public CLASS_NAME:string = "LPolygon";

        public constructor(vars?:IGraphics){
            super();

            if(vars){
                super.init(vars);
            }
        }

		public drawShape():void
		{
			this.graphics.moveTo(this.vars.width / 2, 0);
			for(var i:number = 1; i < this.vars.corner; i++)
			{
				var rad:number = 2 * Math.PI / this.vars.corner * i;
				this.graphics.lineTo(this.vars.width  / 2 * (1 + Math.sin(rad)), this.vars.height / 2 * (1 - Math.cos(rad)));
			}
		}

        public clone(vars?:IGraphics):LPolygon{
            return new LPolygon(vars?vars:this.vars);
        }
    }
}