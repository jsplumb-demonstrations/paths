
import {
    EVENT_TAP,
    EVENT_CANVAS_CLICK,
    EVENT_SURFACE_MODE_CHANGED,
    SurfaceMode,
    DiamondOverlay,
    BlankEndpoint,
    StraightConnector,
    ArrowOverlay,
    DEFAULT,
    ready,
    newInstance,
    ForceDirectedLayout,
    MiniviewPlugin,
    LassoPlugin,
    PathTransport, SurfaceAnimator, ControlsComponent, AnchorLocations
} from "@jsplumbtoolkit/browser-ui"

import { randomGraph } from "jsplumbtoolkit-demo-support"

ready(() => {

    const data = randomGraph(5, 10)

    // get a jsPlumbToolkit instance.
    const toolkit = newInstance()

    const mainElement = document.querySelector("#jtk-demo-paths"),
        canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
        miniviewElement = mainElement.querySelector(".miniview"),
        controls = document.querySelector(".controls") as HTMLElement;

    // path traversal.
    let source:any = null

    let transport:PathTransport = null
    let animator:SurfaceAnimator

    // define the view. we use the template inferencing mechanism to
    // determine that all nodes will be drawn using the template `jtk-template-default`,
    // but we supply some information about edges. Note the overlays: on the default edge,
    // which means on every Edge, we have an arrow at location 1. On 'bidirectional' edges
    // we have an arrow at location 0 also. Two of our edges - [1-4] and [6-2] are marked
    // as being `directed:false` (for the graph to use) and `type:"bidirectional"` (for the
    // renderer to use).
    const view = {
        edges: {
            [DEFAULT]: {
                //paintStyle: { lineWidth: 1, stroke: '#89bcde' },
                overlays: [
                    {type:ArrowOverlay.type, options:{ fill: "#89bcde", width: 10, length: 10, location:1 } }
                ]
            },
            "bidirectional":{
                //parent:"default",
                overlays: [
                    {type:ArrowOverlay.type, options:{ fill: "#89bcde", width: 10, length: 10, location:0, direction:-1 } }
                ]
            }
        },
        nodes:{
            [DEFAULT]:{
                template:`<div>{{name}}</div>`,
                events: {
                    [EVENT_TAP]:(params:any) => {
                        // on node click...
                        if (source == null) {
                            //... either set the current path source. here we also add a class
                            // so you can see its selected.
                            source = params
                            renderer.addClass(source.el, "jtk-animate-source")
                        }
                        else {

                            if (transport != null) {
                                transport.cancel()
                            }

                            // ...or trace a path from the current source to the clicked node.
                            transport = animator.tracePath({
                                source:source.obj,
                                target:params.obj,
                                overlay:{
                                    type:DiamondOverlay.type,
                                    options:{
                                        width:15,
                                        length:15,
                                        fill: "#89bcde"
                                    }
                                },
                                options: {
                                    speed: 160
                                },
                                listener: stateChange
                            })
                            // cleanup the source for the next one.
                            renderer.removeClass(source.el, "jtk-animate-source")
                            source = null

                            if (transport == null) {
                                alert("No path found!")
                            }
                        }
                    }
                }
            }
        }
    }

    // load the data,
    toolkit.load({data})

    // Render
    const renderer = toolkit.render(canvasElement, {
        view:view,
        layout: {
            type: ForceDirectedLayout.type,
            options: {
                padding: {x: 30, y: 30}
            }
        },
        plugins:[
            {
                type:MiniviewPlugin.type,
                options:{
                    container:miniviewElement
                }
            },
            {
                type:LassoPlugin.type,
                options:{
                    filter: ".controls, .controls *, .miniview, .miniview *"
                }
            }
        ],
        events: {
            [EVENT_CANVAS_CLICK]:  (e:Event) => {
                toolkit.clearSelection()
            },
            [EVENT_SURFACE_MODE_CHANGED]: (mode:SurfaceMode) => {
                renderer.removeClass(controls.querySelectorAll("[mode]"), "selected-mode");
                renderer.addClass(controls.querySelectorAll("[mode='" + mode + "']"), "selected-mode");
            }
        },
        defaults: {
            edgesAvoidVertices:true,
            connector: {
                type:StraightConnector.type,
                options:{
                    cssClass: "connectorClass",
                    hoverClass: "connectorHoverClass",
                    cornerRadius:5
                }
            }
        },
        consumeRightClick:false,
        zoomToFit:true
    })

    // get an animator instance to use
    animator = new SurfaceAnimator(renderer)

    // Controls component offers zoom to extents, pan mode/lasso mode
    // buttons, undo/redo. Here we also use its `buttons` extension to
    // supply three buttons we can use to control the path transport.
    new ControlsComponent(controls, renderer, {
        buttons:[
            {
                id:"play",
                class:"transport-play",
                title:"Play path trace",
                handler:(e:MouseEvent, id:string) => {
                    transport && transport.play()
                }
            },
            {
                id:"pause",
                class:"transport-pause",
                title:"Pause path animation",
                handler:(e:MouseEvent, id:string) => {
                    transport && transport.pause()
                }
            },
            {
                id:"cancel",
                class:"transport-cancel",
                title:"Cancel path trace",
                handler:(e:MouseEvent, id:string) => {
                        transport && transport.cancel()
                }
            }
        ]
    })

    // transport controls

    function stateChange(state:string) {
        controls.setAttribute("state", state)
        if (state === "stopped") {
            transport = null
        }
    }

})

