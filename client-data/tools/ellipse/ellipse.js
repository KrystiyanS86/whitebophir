/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function () { //Code isolation
    //Indicates the id of the shape the user is currently drawing or an empty string while the user is not drawing
    let curshape = "Ellipse";
    const icons = ["tools/ellipse/icon-ellipse.svg", "tools/ellipse/icon-circle.svg"];
    let end=false,
        curId = "",
        curUpdate = { //The data of the message that will be sent for every new point
            'type': 'update',
            'id': "",
            'shape': curshape,
            'x': 0,
            'y': 0,
            'x2': 0,
            'y2': 0
        },
        lastTime = performance.now(); //The time at which the last point was drawn

    function start(x, y, evt) {

        //Prevent the press from being interpreted by the browser
        evt.preventDefault();

        curId = Tools.generateUID("e"); //"e" for ellipse

        Tools.drawAndSend({
            'type': 'ellipse',
            'id': curId,
            'shape': curshape,
            'color': Tools.getColor(),
            'size': Tools.getSize(),
            'opacity': Tools.getOpacity(),
            'x': x,
            'y': y,
            'x2': x,
            'y2': y
        });

        curUpdate.id = curId;
        curUpdate.shape = curshape;
        curUpdate.x = x;
        curUpdate.y = y;
    }

    function move(x, y, evt) {
        /*Wait 70ms before adding any point to the currently drawing shape.
        This allows the animation to be smother*/
        if (curId !== "") {
            curUpdate['x2'] = x; curUpdate['y2'] = y;
            if (performance.now() - lastTime > 70 || end) {
                Tools.drawAndSend(curUpdate);
                lastTime = performance.now();
            } else {
                draw(curUpdate);
            }
        }
        if (evt) evt.preventDefault();
    }

    function stop(x, y) {
        //Add a last point to the shape
        end=true;
        move(x, y);
        end=false;
        curId = "";
    }

    function draw(data) {
        Tools.drawingEvent=true;
        switch (data.type) {
            case "ellipse":
                createShape(data);
                break;
            case "update":
                var shape = svg.getElementById(data['id']);
                if (!shape) {
                    console.error("Straight shape: Hmmm... I received a point of a shape that has not been created (%s).", data['id']);
                    createShape({ //create a new shape in order not to loose the points
                        "id": data['id'],
                        "x": data['x2'],
                        "y": data['y2']
                    });
                }
                updateShape(shape, data, data.shape === "Circle");
                break;
            default:
                console.error("Straight shape: Draw instruction with unknown type. ", data);
                break;
        }
    }

    var svg = Tools.svg;
    function createShape(data) {
        //Creates a new shape on the canvas, or update a shape that already exists with new information
        var shape = svg.getElementById(data.id) || Tools.createSVGElement("ellipse");
        updateShape(shape, data, data.shape === "Circle");
        shape.id = data.id;
        //If some data is not provided, choose default value. The shape may be updated later
        shape.setAttribute("stroke", data.color || "black");
        shape.setAttribute("stroke-width", data.size || 10);
        shape.setAttribute("opacity", Math.max(0.1, Math.min(1, data.opacity)) || 1);
        Tools.drawingArea.appendChild(shape);
        return shape;
    }

    function updateShape(shape, data, circle) {
        if (circle) {
            var deltaX = data['x2'] - data['x'];
            var deltaY = data['y2'] - data['y'];
            var r = Math.max(Math.abs(deltaX), Math.abs(deltaY))/2;
            shape.cx.baseVal.value = data['x'] + ((deltaX > 0) - (deltaX < 0)) * r;
            shape.cy.baseVal.value = data['y'] + ((deltaY > 0) - (deltaY < 0)) * r;
            //var r = Math.round(Math.sqrt(Math.pow(data['x2'] - data['x'],2)+Math.pow(data['y2'] - data['y'],2))/2);
            shape.rx.baseVal.value = r;
            shape.ry.baseVal.value = r;
        } else {
            shape.cx.baseVal.value = Math.round((data['x2'] + data['x'])/2);
            shape.cy.baseVal.value = Math.round((data['y2'] + data['y'])/2);
            shape.rx.baseVal.value = Math.abs(data['x2'] - data['x'])/2;
            shape.ry.baseVal.value = Math.abs(data['y2'] - data['y'])/2;
        }
    }


    function toggle(elem){
        let index = 0;
        if (curshape === "Ellipse") {
            curshape = "Circle";
            index = 1;
        } else {
            curshape = "Ellipse";
        }
        elem.getElementsByClassName("tool-icon")[0].src = icons[index];
        elem.getElementsByClassName("tool-name")[0].textContent = curshape;
    }

    function keyToggle(e) {
        if (e.key === "Shift" && Tools.curTool.name === "Ellipse" && curId) {
            var elem = document.getElementById("toolID-" + Tools.curTool.name);
            Tools.curTool.toggle(elem);
            curUpdate.shape = curshape;
            draw(curUpdate);
        }
    }
    window.addEventListener("keydown", keyToggle);
    window.addEventListener("keyup", keyToggle);

    Tools.add({ //The new tool
        "name": "Ellipse",
        "shortcut": "c",
        "listeners": {
            "press": start,
            "move": move,
            "release": stop,
        },
        "draw": draw,
        "toggle": toggle,
        "mouseCursor": "crosshair",
        "icon": icons[0],
        "stylesheet": "tools/ellipse/ellipse.css"
    });

})(); //End of code isolation
