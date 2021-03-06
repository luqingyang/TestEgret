//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var egret;
(function (egret) {
    /**
     * @class egret.HTML5CanvasRenderer
     * @classdesc
     * @extends egret.RendererContext
     * @private
     */
    var HTML5CanvasRenderer = (function (_super) {
        __extends(HTML5CanvasRenderer, _super);
        function HTML5CanvasRenderer(canvas, useCacheCanvas) {
            if (useCacheCanvas === void 0) { useCacheCanvas = true; }
            _super.call(this);
            this.useCacheCanvas = useCacheCanvas;
            egret.Texture.prototype.draw = egret.Texture.prototype._drawForCanvas;
            egret.Texture.prototype.dispose = egret.Texture.prototype._disposeForCanvas;
            this.canvas = canvas || this.createCanvas();
            this.canvasContext = this.canvas.getContext("2d");
            if (useCacheCanvas) {
                this._cacheCanvas = document.createElement("canvas");
                this._cacheCanvas.width = this.canvas.width;
                this._cacheCanvas.height = this.canvas.height;
                this._cacheCanvasContext = this._cacheCanvas.getContext("2d");
                this.drawCanvasContext = this._cacheCanvasContext;
            }
            else {
                this.drawCanvasContext = this.canvasContext;
            }
            this.onResize();
            var f = this.drawCanvasContext.setTransform;
            var that = this;
            this.drawCanvasContext.setTransform = function (a, b, c, d, tx, ty) {
                that._matrixA = a;
                that._matrixB = b;
                that._matrixC = c;
                that._matrixD = d;
                that._matrixTx = tx;
                that._matrixTy = ty;
                f.call(that.drawCanvasContext, a, b, c, d, tx, ty);
            };
            this._matrixA = 1;
            this._matrixB = 0;
            this._matrixC = 0;
            this._matrixD = 1;
            this._matrixTx = 0;
            this._matrixTy = 0;
            this._transformTx = 0;
            this._transformTy = 0;
            this.initBlendMode();
        }
        var __egretProto__ = HTML5CanvasRenderer.prototype;
        __egretProto__.createCanvas = function () {
            var canvas = egret.Browser.getInstance().$("#egretCanvas");
            if (!canvas) {
                var container = document.getElementById(egret.StageDelegate.canvas_div_name);
                canvas = egret.Browser.getInstance().$new("canvas");
                canvas.id = "egretCanvas";
                container.appendChild(canvas);
            }
            egret.MainContext.instance.stage.addEventListener(egret.Event.RESIZE, this.onResize, this);
            return canvas;
        };
        __egretProto__.onResize = function () {
            //设置canvas宽高
            if (this.canvas) {
                var container = document.getElementById(egret.StageDelegate.canvas_div_name);
                this.canvas.width = egret.MainContext.instance.stage.stageWidth; //stageW
                this.canvas.height = egret.MainContext.instance.stage.stageHeight; //stageH
                this.canvas.style.width = container.style.width;
                this.canvas.style.height = container.style.height;
                //              this.canvas.style.position = "absolute";
                if (this.useCacheCanvas) {
                    this._cacheCanvas.width = this.canvas.width;
                    this._cacheCanvas.height = this.canvas.height;
                }
                this.drawCanvasContext["imageSmoothingEnabled"] = egret.RendererContext.imageSmoothingEnabled;
                this.drawCanvasContext["webkitImageSmoothingEnabled"] = egret.RendererContext.imageSmoothingEnabled;
                this.drawCanvasContext["mozImageSmoothingEnabled"] = egret.RendererContext.imageSmoothingEnabled;
                this.drawCanvasContext["msImageSmoothingEnabled"] = egret.RendererContext.imageSmoothingEnabled;
            }
        };
        __egretProto__.clearScreen = function () {
            var list = egret.RenderFilter.getInstance().getDrawAreaList();
            for (var i = 0, l = list.length; i < l; i++) {
                var area = list[i];
                this.clearRect(area.x, area.y, area.width, area.height);
            }
            var stage = egret.MainContext.instance.stage;
            if (this.useCacheCanvas) {
                this._cacheCanvasContext.clearRect(0, 0, stage.stageWidth, stage.stageHeight);
            }
            this.renderCost = 0;
        };
        __egretProto__.clearRect = function (x, y, w, h) {
            //            this.canvasContext.fillRect(x, y, w, h);
            this.canvasContext.clearRect(x, y, w, h);
        };
        __egretProto__.drawImage = function (texture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, renderType) {
            if (renderType === void 0) { renderType = undefined; }
            destX += this._transformTx;
            destY += this._transformTy;
            var beforeDraw = egret.getTimer();
            texture.draw(this.drawCanvasContext, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, renderType);
            _super.prototype.drawImage.call(this, texture, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, renderType);
            this.renderCost += egret.getTimer() - beforeDraw;
        };
        __egretProto__.setTransform = function (matrix) {
            //在没有旋转缩放斜切的情况下，先不进行矩阵偏移，等下次绘制的时候偏移
            if (matrix.a == 1 && matrix.b == 0 && matrix.c == 0 && matrix.d == 1 && this._matrixA == 1 && this._matrixB == 0 && this._matrixC == 0 && this._matrixD == 1) {
                this._transformTx = matrix.tx - this._matrixTx;
                this._transformTy = matrix.ty - this._matrixTy;
                return;
            }
            this._transformTx = this._transformTy = 0;
            if (this._matrixA != matrix.a || this._matrixB != matrix.b || this._matrixC != matrix.c || this._matrixD != matrix.d || this._matrixTx != matrix.tx || this._matrixTy != matrix.ty) {
                this.drawCanvasContext.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            }
        };
        __egretProto__.setAlpha = function (alpha, blendMode) {
            this.drawCanvasContext.globalAlpha = alpha;
            if (blendMode) {
                this.blendValue = this.blendModes[blendMode];
                this.drawCanvasContext.globalCompositeOperation = this.blendValue;
            }
            else if (this.blendValue != egret.BlendMode.NORMAL) {
                this.blendValue = this.blendModes[egret.BlendMode.NORMAL];
                this.drawCanvasContext.globalCompositeOperation = this.blendValue;
            }
        };
        __egretProto__.initBlendMode = function () {
            this.blendModes = {};
            this.blendModes[egret.BlendMode.NORMAL] = "source-over";
            this.blendModes[egret.BlendMode.ADD] = "lighter";
            this.blendModes[egret.BlendMode.ERASE] = "destination-out";
            this.blendModes[egret.BlendMode.ERASE_REVERSE] = "destination-in";
        };
        __egretProto__.setupFont = function (textField, style) {
            if (style === void 0) { style = null; }
            style = style || {};
            var properties = textField._TF_Props_;
            var italic = style.italic == null ? properties._italic : style.italic;
            var bold = style.bold == null ? properties._bold : style.bold;
            var size = style.size == null ? properties._size : style.size;
            var fontFamily = style.fontFamily == null ? properties._fontFamily : style.fontFamily;
            var ctx = this.drawCanvasContext;
            var font = italic ? "italic " : "normal ";
            font += bold ? "bold " : "normal ";
            font += size + "px " + fontFamily;
            ctx.font = font;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
        };
        __egretProto__.measureText = function (text) {
            var result = this.drawCanvasContext.measureText(text);
            return result.width;
        };
        __egretProto__.drawText = function (textField, text, x, y, maxWidth, style) {
            if (style === void 0) { style = null; }
            this.setupFont(textField, style);
            style = style || {};
            var properties = textField._TF_Props_;
            var textColor;
            if (style.textColor != null) {
                textColor = egret.toColorString(style.textColor);
            }
            else {
                textColor = properties._textColorString;
            }
            var strokeColor;
            if (style.strokeColor != null) {
                strokeColor = egret.toColorString(style.strokeColor);
            }
            else {
                strokeColor = properties._strokeColorString;
            }
            var outline;
            if (style.stroke != null) {
                outline = style.stroke;
            }
            else {
                outline = properties._stroke;
            }
            var renderContext = this.drawCanvasContext;
            renderContext.fillStyle = textColor;
            renderContext.strokeStyle = strokeColor;
            if (outline) {
                renderContext.lineWidth = outline * 2;
                renderContext.strokeText(text, x + this._transformTx, y + this._transformTy, maxWidth || 0xFFFF);
            }
            renderContext.fillText(text, x + this._transformTx, y + this._transformTy, maxWidth || 0xFFFF);
            _super.prototype.drawText.call(this, textField, text, x, y, maxWidth, style);
        };
        __egretProto__.strokeRect = function (x, y, w, h, color) {
            this.drawCanvasContext.strokeStyle = color;
            this.drawCanvasContext.strokeRect(x, y, w, h);
        };
        __egretProto__.pushMask = function (mask) {
            this.drawCanvasContext.save();
            this.drawCanvasContext.beginPath();
            this.drawCanvasContext.rect(mask.x + this._transformTx, mask.y + this._transformTy, mask.width, mask.height);
            this.drawCanvasContext.clip();
            this.drawCanvasContext.closePath();
        };
        __egretProto__.popMask = function () {
            this.drawCanvasContext.restore();
            this.drawCanvasContext.setTransform(1, 0, 0, 1, 0, 0);
        };
        __egretProto__.onRenderStart = function () {
            this.drawCanvasContext.save();
        };
        __egretProto__.onRenderFinish = function () {
            this.drawCanvasContext.restore();
            this.drawCanvasContext.setTransform(1, 0, 0, 1, 0, 0);
            if (this.useCacheCanvas) {
                var canvasWidth = this._cacheCanvas.width;
                var canvasHeight = this._cacheCanvas.height;
                var list = egret.RenderFilter.getInstance().getDrawAreaList();
                for (var i = 0, l = list.length; i < l; i++) {
                    var area = list[i];
                    var areaX = area.x;
                    var areaY = area.y;
                    var areaWidth = area.width;
                    var areaHeight = area.height;
                    if (areaX + areaWidth > canvasWidth) {
                        areaWidth = canvasWidth - areaX;
                    }
                    if (areaY + areaHeight > canvasHeight) {
                        areaHeight = canvasHeight - areaY;
                    }
                    if (areaWidth > 0 && areaHeight > 0) {
                        this.canvasContext.drawImage(this._cacheCanvas, areaX, areaY, areaWidth, areaHeight, areaX, areaY, areaWidth, areaHeight);
                    }
                }
            }
        };
        __egretProto__.drawCursor = function (x1, y1, x2, y2) {
            this.drawCanvasContext.strokeStyle = "#40a5ff";
            this.drawCanvasContext.lineWidth = 2;
            this.drawCanvasContext.beginPath();
            this.drawCanvasContext.moveTo(Math.round(x1 + this._transformTx), Math.round(y1 + this._transformTy));
            this.drawCanvasContext.lineTo(Math.round(x2 + this._transformTx), Math.round(y2 + this._transformTy));
            this.drawCanvasContext.closePath();
            this.drawCanvasContext.stroke();
        };
        return HTML5CanvasRenderer;
    })(egret.RendererContext);
    egret.HTML5CanvasRenderer = HTML5CanvasRenderer;
    HTML5CanvasRenderer.prototype.__class__ = "egret.HTML5CanvasRenderer";
})(egret || (egret = {}));
var egret_h5_graphics;
(function (egret_h5_graphics) {
    function beginFill(color, alpha) {
        if (alpha === void 0) { alpha = 1; }
        var _colorBlue = color & 0x0000FF;
        var _colorGreen = (color & 0x00ff00) >> 8;
        var _colorRed = color >> 16;
        var _colorStr = "rgba(" + _colorRed + "," + _colorGreen + "," + _colorBlue + "," + alpha + ")";
        this.fillStyleColor = _colorStr;
        this._pushCommand(new Command(this._setStyle, this, [_colorStr]));
    }
    egret_h5_graphics.beginFill = beginFill;
    function drawRect(x, y, width, height) {
        this._pushCommand(new Command(function (x, y, width, height) {
            var rendererContext = this.renderContext;
            this.canvasContext.beginPath();
            this.canvasContext.rect(rendererContext._transformTx + x, rendererContext._transformTy + y, width, height);
            this.canvasContext.closePath();
        }, this, [x, y, width, height]));
        this._fill();
        this._checkRect(x, y, width, height);
    }
    egret_h5_graphics.drawRect = drawRect;
    function drawCircle(x, y, r) {
        this._pushCommand(new Command(function (x, y, r) {
            var rendererContext = this.renderContext;
            this.canvasContext.beginPath();
            this.canvasContext.arc(rendererContext._transformTx + x, rendererContext._transformTy + y, r, 0, Math.PI * 2);
            this.canvasContext.closePath();
        }, this, [x, y, r]));
        this._fill();
        this._checkRect(x - r, y - r, 2 * r, 2 * r);
    }
    egret_h5_graphics.drawCircle = drawCircle;
    function drawRoundRect(x, y, width, height, ellipseWidth, ellipseHeight) {
        //非等值椭圆角实现
        this._pushCommand(new Command(function (x, y, width, height, ellipseWidth, ellipseHeight) {
            var rendererContext = this.renderContext;
            var _x = rendererContext._transformTx + x; //控制X偏移
            var _y = rendererContext._transformTy + y; //控制Y偏移
            var _w = width;
            var _h = height;
            var _ew = ellipseWidth / 2;
            var _eh = ellipseHeight ? ellipseHeight / 2 : _ew;
            var right = _x + _w;
            var bottom = _y + _h;
            var ax = right;
            var ay = bottom - _eh;
            this.canvasContext.beginPath();
            this.canvasContext.moveTo(ax, ay);
            this.canvasContext.quadraticCurveTo(right, bottom, right - _ew, bottom);
            this.canvasContext.lineTo(_x + _ew, bottom);
            this.canvasContext.quadraticCurveTo(_x, bottom, _x, bottom - _eh);
            this.canvasContext.lineTo(_x, _y + _eh);
            this.canvasContext.quadraticCurveTo(_x, _y, _x + _ew, _y);
            this.canvasContext.lineTo(right - _ew, _y);
            this.canvasContext.quadraticCurveTo(right, _y, right, _y + _eh);
            this.canvasContext.lineTo(ax, ay);
            this.canvasContext.closePath();
        }, this, [x, y, width, height, ellipseWidth, ellipseHeight]));
        this._fill();
        this._checkRect(x, y, width, height);
    }
    egret_h5_graphics.drawRoundRect = drawRoundRect;
    function drawEllipse(x, y, width, height) {
        //基于均匀压缩算法
        this._pushCommand(new Command(function (x, y, width, height) {
            var rendererContext = this.renderContext;
            this.canvasContext.save();
            var _x = rendererContext._transformTx + x + width / 2; //控制X偏移
            var _y = rendererContext._transformTy + y + height / 2; //控制Y偏移
            var r = (width > height) ? width : height; //选宽高较大者做为arc半径参数
            var ratioX = width / r; //横轴缩放比率
            var ratioY = height / r; //纵轴缩放比率
            r /= 2;
            this.canvasContext.scale(ratioX, ratioY); //进行缩放(均匀压缩)
            this.canvasContext.beginPath();
            this.canvasContext.arc(_x / ratioX, _y / ratioY, r, 0, 2 * Math.PI);
            this.canvasContext.closePath();
            this.canvasContext.restore();
        }, this, [x, y, width, height]));
        this._fill();
        this._checkRect(x, y, width, height);
    }
    egret_h5_graphics.drawEllipse = drawEllipse;
    function lineStyle(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit) {
        if (thickness === void 0) { thickness = NaN; }
        if (color === void 0) { color = 0; }
        if (alpha === void 0) { alpha = 1.0; }
        if (pixelHinting === void 0) { pixelHinting = false; }
        if (scaleMode === void 0) { scaleMode = "normal"; }
        if (caps === void 0) { caps = null; }
        if (joints === void 0) { joints = null; }
        if (miterLimit === void 0) { miterLimit = 3; }
        if (this.strokeStyleColor) {
            this.createEndLineCommand();
            this._pushCommand(this.endLineCommand);
        }
        var _colorBlue = color & 0x0000FF;
        var _colorGreen = (color & 0x00ff00) >> 8;
        var _colorRed = color >> 16;
        var _colorStr = "rgba(" + _colorRed + "," + _colorGreen + "," + _colorBlue + "," + alpha + ")";
        this.strokeStyleColor = _colorStr;
        this._pushCommand(new Command(function (lineWidth, strokeStyle) {
            this.canvasContext.lineWidth = lineWidth;
            this.canvasContext.strokeStyle = strokeStyle;
            this.canvasContext.beginPath();
        }, this, [thickness, _colorStr]));
        this.moveTo(this.lineX, this.lineY);
    }
    egret_h5_graphics.lineStyle = lineStyle;
    function lineTo(x, y) {
        this._pushCommand(new Command(function (x, y) {
            var rendererContext = this.renderContext;
            var canvasContext = this.canvasContext;
            canvasContext.lineTo(rendererContext._transformTx + x, rendererContext._transformTy + y);
        }, this, [x, y]));
        this._checkPoint(this.lineX, this.lineY);
        this.lineX = x;
        this.lineY = y;
        this._checkPoint(x, y);
    }
    egret_h5_graphics.lineTo = lineTo;
    function curveTo(controlX, controlY, anchorX, anchorY) {
        this._pushCommand(new Command(function (x, y, ax, ay) {
            var rendererContext = this.renderContext;
            var canvasContext = this.canvasContext;
            canvasContext.quadraticCurveTo(rendererContext._transformTx + x, rendererContext._transformTy + y, rendererContext._transformTx + ax, rendererContext._transformTy + ay);
        }, this, [controlX, controlY, anchorX, anchorY]));
        this._checkPoint(this.lineX, this.lineY);
        this.lineX = anchorX;
        this.lineY = anchorY;
        this._checkPoint(controlX, controlY);
        this._checkPoint(anchorX, anchorY);
    }
    egret_h5_graphics.curveTo = curveTo;
    function moveTo(x, y) {
        this._pushCommand(new Command(function (x, y) {
            var rendererContext = this.renderContext;
            var canvasContext = this.canvasContext;
            canvasContext.moveTo(rendererContext._transformTx + x, rendererContext._transformTy + y);
        }, this, [x, y]));
    }
    egret_h5_graphics.moveTo = moveTo;
    function clear() {
        this.commandQueue.length = 0;
        this.lineX = 0;
        this.lineY = 0;
        this.strokeStyleColor = null;
        this.fillStyleColor = null;
        this._minX = 0;
        this._minY = 0;
        this._maxX = 0;
        this._maxY = 0;
        this._firstCheck = true;
        this._dirty = true;
    }
    egret_h5_graphics.clear = clear;
    function createEndFillCommand() {
        if (!this.endFillCommand) {
            this.endFillCommand = new Command(function () {
                this.canvasContext.fill();
                this.canvasContext.closePath();
            }, this, null);
        }
    }
    egret_h5_graphics.createEndFillCommand = createEndFillCommand;
    function endFill() {
        if (this.fillStyleColor != null) {
            this._fill();
            this.fillStyleColor = null;
        }
    }
    egret_h5_graphics.endFill = endFill;
    function _fill() {
        if (this.fillStyleColor) {
            this.createEndFillCommand();
            this._pushCommand(this.endFillCommand);
        }
        if (this.strokeStyleColor) {
            this.createEndLineCommand();
            this._pushCommand(this.endLineCommand);
        }
    }
    egret_h5_graphics._fill = _fill;
    function createEndLineCommand() {
        if (!this.endLineCommand) {
            this.endLineCommand = new Command(function () {
                this.canvasContext.stroke();
                this.canvasContext.closePath();
            }, this, null);
        }
    }
    egret_h5_graphics.createEndLineCommand = createEndLineCommand;
    function _pushCommand(cmd) {
        this.commandQueue.push(cmd);
        this._dirty = true;
    }
    egret_h5_graphics._pushCommand = _pushCommand;
    function _draw(renderContext) {
        var length = this.commandQueue.length;
        if (length == 0) {
            return;
        }
        this.renderContext = renderContext;
        this.canvasContext = this.renderContext.drawCanvasContext;
        var canvasContext = this.canvasContext;
        canvasContext.save();
        if (this.strokeStyleColor && length > 0 && this.commandQueue[length - 1] != this.endLineCommand) {
            this.createEndLineCommand();
            this._pushCommand(this.endLineCommand);
            length = this.commandQueue.length;
        }
        for (var i = 0; i < length; i++) {
            var command = this.commandQueue[i];
            command.method.apply(command.thisObject, command.args);
        }
        canvasContext.restore();
        this._dirty = false;
    }
    egret_h5_graphics._draw = _draw;
    var Command = (function () {
        function Command(method, thisObject, args) {
            this.method = method;
            this.thisObject = thisObject;
            this.args = args;
        }
        var __egretProto__ = Command.prototype;
        return Command;
    })();
    Command.prototype.__class__ = "egret_h5_graphics.Command";
    function _setStyle(colorStr) {
        this.canvasContext.fillStyle = colorStr;
        this.canvasContext.beginPath();
    }
    egret_h5_graphics._setStyle = _setStyle;
    function init() {
        for (var key in egret_h5_graphics) {
            egret.Graphics.prototype[key] = egret_h5_graphics[key];
        }
        egret.RendererContext.createRendererContext = function (canvas) {
            return new egret.HTML5CanvasRenderer(canvas, false);
        };
    }
    egret_h5_graphics.init = init;
})(egret_h5_graphics || (egret_h5_graphics = {}));
egret_h5_graphics.init();
