(function ($) {

    $.fn.canvasAreaDraw = function (options) {

        this.each(function (index, element) {
            init.apply(element, [index, element, options]);
        });

    }

    var init = function (index, input, options) {

        var points, activePoint, active, settings;
        var $reset, $undo, $addnew, $canvas, ctx, image;
        var draw, mousedown, stopdrag, move, moveall, resize, reset, undo, addnew, rightclick, record;
        var startpoint = false;

        if (!active) {
            active = 0;
        }

        settings = $.extend({
            imageUrl: $(this).attr('data-image-url')
        }, options);

        if (!points) {
            points = [[]];
        }

        $reset = $('<button type="button" class="btn"><i class="icon-trash"></i>Reset</button>');
        $undo = $('<button type="button" class="btn"><i class="icon-undo"></i>Undo</button>');
        $addnew = $('<button type="button" class="btn"><i class="icon-plus"></i>Add New</button>');
        $canvas = $('<canvas>');
        ctx = $canvas[0].getContext('2d');

        image = new Image();
        resize = function () {
            $canvas.attr('height', image.height).attr('width', image.width);
            draw();
        };
        $(image).load(resize);
        image.src = settings.imageUrl;
        if (image.loaded) {
            resize();
        }
        $canvas.css({background: 'url(' + image.src + ')'});

        $(input).after('<br>', $canvas, '<br>', $reset, $undo, $addnew);

        reset = function () {
            points = [[]];
            active = 0;
            record();
            draw();
        };

        undo = function () {
            if (points[active].length <= 0  && (active-1) >= 0) {
                points.splice(index, 1);

                if(index <= active) {
                    --active;
                }
            } else {
                points[active].splice(-1, 1);
                record();
                draw();
            }
        };

        addnew = function () {
            points.push([]);
            active++;
            record();
        };

        move = function (e) {
            if (!e.offsetX) {
                e.offsetX = (e.pageX - $(e.target).offset().left);
                e.offsetY = (e.pageY - $(e.target).offset().top);
            }
            var _points = points[active];
            _points[activePoint] = [Math.round(e.offsetX), Math.round(e.offsetY)];
            record();
            draw();
        };

        moveall = function (e) {
            if (!e.offsetX) {
                e.offsetX = (e.pageX - $(e.target).offset().left);
                e.offsetY = (e.pageY - $(e.target).offset().top);
            }
            if (!startpoint) {
                startpoint = {x: Math.round(e.offsetX), y: Math.round(e.offsetY)};
            }
            var sdvpoint = {x: Math.round(e.offsetX), y: Math.round(e.offsetY)};
            var _points = points[active];
            for (var i = 0; i < _points.length; i++) {
                _points[i][0] = (sdvpoint.x - startpoint.x) + _points[i][0];
                _points[i][1] = (sdvpoint.y - startpoint.y) + _points[i][1];
            }
            startpoint = sdvpoint;
            draw();
            record();
        };

        stopdrag = function () {
            $(this).off('mousemove');
            record();
            activePoint = null;
        };

        rightclick = function (e) {
            e.preventDefault();
            if(!e.offsetX) {
                e.offsetX = (e.pageX - $(e.target).offset().left);
                e.offsetY = (e.pageY - $(e.target).offset().top);
            }
            var x = e.offsetX, y = e.offsetY;
            var _points = points[active];
            for (var i = 0; i < _points.length; ++i) {
                var dis = Math.sqrt(Math.pow(x - _points[i][0], 2) + Math.pow(y - _points[i][1], 2));
                if ( dis < 6 ) {
                    _points.splice(i, 1);
                    draw();
                    record();
                    return false;
                }
            }
            return false;
        };

        mousedown = function (e) {
            var _points = points[active];
            var x, y, dis, lineDis, insertAt = _points.length;

            if (e.which === 3) {
                return false;
            }

            e.preventDefault();
            if (!e.offsetX) {
                e.offsetX = (e.pageX - $(e.target).offset().left);
                e.offsetY = (e.pageY - $(e.target).offset().top);
            }
            x = e.offsetX;
            y = e.offsetY;

            if (_points.length >= 3) {
                var c = getCenter(_points);
                ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
                dis = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2));
                if (dis < 6) {
                    startpoint = false;
                    $(this).on('mousemove', moveall);
                    return false;
                }
            }

            for (var i = 0; i < _points.length; i++) {
                dis = Math.sqrt(Math.pow(x - _points[i][0], 2) + Math.pow(y - _points[i][1], 2));
                if (dis < 6) {
                    activePoint = i;
                    $(this).on('mousemove', move);
                    return false;
                }
            }

            for (var i = 0; i < _points.length; i++) {
                if (i > 1) {
                    lineDis = dotLineLength(
                        x, y,
                        _points[i][0], _points[i][1],
                        _points[i - 1][0], _points[i - 1][1],
                        true
                    );
                    if (lineDis < 6) {
                        insertAt = i;
                    }
                }
            }

            _points.splice(insertAt, 0, [Math.round(x), Math.round(y)]);
            activePoint = insertAt;
            $(this).on('mousemove', move);

            draw();
            record();

            return false;
        };

        draw = function () {
            ctx.canvas.width = ctx.canvas.width;

            if(points.length > 0) {
                drawSingle(points[active], active);
            }

            for(var p = 0; p < points.length; ++p) {

                var _points = points[p];

                if (_points.length == 0 || active == p) {
                    continue;
                }

                drawSingle(_points, p);
            }
        };

        var drawSingle = function (_points, p) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'rgb(255,255,255)';
            ctx.strokeStyle = 'rgb(255,20,20)';
            ctx.lineWidth = 1;

            if (_points.length >= 3) {
                var c = getCenter(_points);
                ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
            }

            ctx.beginPath();
            ctx.moveTo(_points[0], _points[1]);

            for (var i = 0; i < _points.length; i++) {
                if (active == p) {
                    ctx.fillRect(_points[i][0] - 2, _points[i][1] - 2, 4, 4);
                    ctx.strokeRect(_points[i][0] - 2, _points[i][1] - 2, 4, 4);                
                }
                ctx.lineTo(_points[i][0], _points[i][1]);
            }

            ctx.closePath();
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fill();
            ctx.stroke();
        }

        record = function () {
            $(input).val(JSON.stringify(points));
        };

        getCenter = function (_points) {
            var ptc = [];
            //var _points = points[active];

            if (!_points.length) {
                return;
            }

            for (i = 0; i < _points.length; i++) {
                ptc.push({x: _points[i][0], y: _points[i][1]});
            }
            var first = ptc[0], last = ptc[ptc.length - 1];
            if (first.x != last.x || first.y != last.y) ptc.push(first);
            var twicearea = 0,
                x = 0, y = 0,
                nptc = ptc.length,
                p1, p2, f;
            for (var i = 0, j = nptc - 1; i < nptc; j = i++) {
                p1 = ptc[i];
                p2 = ptc[j];
                f = p1.x * p2.y - p2.x * p1.y;
                twicearea += f;
                x += ( p1.x + p2.x ) * f;
                y += ( p1.y + p2.y ) * f;
            }
            f = twicearea * 3;
            return {x: x / f, y: y / f};
        };

        $(document).find($reset).click(reset);
        $(document).find($undo).click(undo);
        $(document).find($addnew).click(addnew);
        $(document).find($canvas).on('mousedown', mousedown);
        $(document).find($canvas).on('contextmenu', rightclick);
        $(document).find($canvas).on('mouseup', stopdrag);

    };

    $(document).ready(function () {
        $('.canvas-area[data-image-url]').canvasAreaDraw();
    });

    var dotLineLength = function (x, y, x0, y0, x1, y1, o) {
        function lineLength(x, y, x0, y0) {
            return Math.sqrt((x -= x0) * x + (y -= y0) * y);
        }

        if (o && !(o = function (x, y, x0, y0, x1, y1) {
                if (!(x1 - x0)) return {x: x0, y: y};
                else if (!(y1 - y0)) return {x: x, y: y0};
                var left, tg = -1 / ((y1 - y0) / (x1 - x0));
                return {
                    x: left = (x1 * (x * tg - y + y0) + x0 * (x * -tg + y - y1)) / (tg * (x1 - x0) + y0 - y1),
                    y: tg * left - tg * x + y
                };
            }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))) {
            var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
            return l1 > l2 ? l2 : l1;
        }
        else {
            var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
            return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
        }
    };
})(jQuery);

