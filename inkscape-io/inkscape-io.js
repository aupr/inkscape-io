// inkscape-io.js 0.1.0 - Copyright (c) 2020 Aman Ullah  - Licensed under the MIT license
// Dependency Snap.svg-0.5.1

;(function() {

    Snap.plugin( function( Snap, Element, Paper, global ) {
        e = Element.prototype;

        e.inkscapeRotation = function (minVal, maxVal, minAngle, maxAngle) {
            var x1 = minVal;
            var x2 = maxVal;
            var y1 = minAngle;
            var y2 = maxAngle;
            var m = (y2 - y1) / (x2 - x1);
            var animateTime = 1000;
            var pv = 0;
            var me = this;
            this.setAnimateTime = function (ms) {
                animateTime = ms;
            };
            this.animate = function (value) {
                var x = value<minVal?minVal:value>maxVal?maxVal:value;
                var val = (m * x) + (y1 - (m * x1));
                var b = this.getBBox(true);
                var px = b.cx + parseFloat(this.attr('inkscape:transform-center-x'));
                var py = b.cy - parseFloat(this.attr('inkscape:transform-center-y'));
                //var me = this;
                Snap.animate(pv, val, function (va) {
                    me.transform( "r" + va + ',' + px + ',' + py );
                    pv = va;
                }, animateTime);
            };
            this.rotate = function (value) {
                var x = value<minVal?minVal:value>maxVal?maxVal:value;
                var val = (m * x) + (y1 - (m * x1));
                var b = this.getBBox(true);
                var px = b.cx + parseFloat(this.attr('inkscape:transform-center-x'));
                var py = b.cy - parseFloat(this.attr('inkscape:transform-center-y'));
                me.transform( "r" + val + ',' + px + ',' + py );
                pv = val;
            };
            this.rotate(minVal);
            return this;
        }

        // visibility // opacity
        // TODO: have to complete this function
        e.inkscapeVisibiliy = function() {

            return this;
        };

        e.inkscapeSetColor = function(colorCode) {
            this.attr({
                fill: colorCode
            });
        };

        e.inkscapeSetText = function(text) {
            this.attr({
                text: text
            });
        };

        e.inkscapeProgress = function(fixedAt) {
            const se = this;
            const b = se.getBBox(true);
            let pv = 100;
            var animateTime = 1000;
            this.setAnimateTime = function (ms) {
                animateTime = ms;
            };
            this.value = function (v) {
                const ht = (b.h * (v/100));
                const wt = (b.w * (v/100));

                switch (fixedAt) {
                    case "top": se.attr({height: ht}); break;
                    case "bottom": se.attr({height: ht, y: b.y + (b.h - ht)}); break;
                    case "left": se.attr({width: wt}); break;
                    case "right": se.attr({width: wt, x: b.x + (b.w - wt)}); break;
                }
            };
            let invf = this.value;
            this.animate = function (av) {
                Snap.animate(pv, av, function (anv) {
                    invf(anv);
                    pv = anv;
                }, animateTime);
            }
            return this;
        }

        e.inkscapeMove = function (direction) {
            const se = this;
            const b = se.getBBox(true);
            let pv = 0;
            var animateTime = 1000;
            this.setAnimateTime = function (ms) {
                animateTime = ms;
            };
            this.move = function (v) {
                v = parseInt(v);
                switch (direction) {
                    case "left": se.attr({x: b.x - v}); break;
                    case "right": se.attr({x: b.x + v}); break;
                    case "up": se.attr({y: b.y + v}); break;
                    case "down": se.attr({y: b.y - v}); break;
                }
            };
            let invf = this.move;
            this.animate = function (av) {
                Snap.animate(pv, av, function (anv) {
                    invf(anv);
                    pv = anv;
                }, animateTime);
            };
            return this;
        }

    });

})();
