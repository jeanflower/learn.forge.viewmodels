/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

$(document).ready(function () {
  prepareAppBucketTree();
  $('#refreshBuckets').click(function () {
    $('#appBuckets').jstree(true).refresh();
  });
});
const nodeTypesIcons = {
  'default': {
    'icon': 'glyphicon glyphicon-question-sign'
  },
  '#': {
    'icon': 'glyphicon glyphicon-cloud'
  },
  'bucket': {
    'icon': 'glyphicon glyphicon-folder-open'
  },
  'object': {
    'icon': 'glyphicon glyphicon-file'
  }
};

let viewer;

function showObjectView(
  bucketObjectArray,
  callback = (viewer)=>{},
){
  // console.log('starting showObjectView');
  var optionsForInitializer = {
    env: 'AutodeskProduction',
    getAccessToken: getForgeToken
  };
  Autodesk.Viewing.Initializer(optionsForInitializer, async() => {
    // suppress logs from THREE as they are cluttering up my console
    THREE.log = ()=>{};

    const container = document.getElementById("objectView");
    if(container === null){
      console.log(`element with id objectView not found`);
      return;
    }

    // console.log('Initialized viewer OK');
    viewer = new Autodesk.Viewing.GuiViewer3D(container);
    await viewer.start();
    // console.log('Started viewer');
    // console.log('loadIntoViewer for bucketObjectArray = ' + bucketObjectArray);
    bucketObjectArray.forEach(function(bucketObject){
      getForgeToken(function (access_token) {
        const url = 
          'https://developer.api.autodesk.com/modelderivative/v2/designdata/' +
          bucketObject.objectName +
          '/manifest';
        jQuery.ajax({
          url: url,
          headers: { 'Authorization': 'Bearer ' + access_token },
          success: function (res) {
            if (res.progress === 'success' || res.progress === 'complete') {
              // console.log('load derivative of model in element');
              loadIntoViewer(bucketObject, viewer);
            } else {
              console.log(`translation-in-progress for ${bucketObject.friendlyName}`);
              if(bucketObjectArray.length === 1){
                $(objectView).html(
                  'The translation job is still running: ' +
                  res.progress +
                  '. Please try again in a moment.'
                );
              }
            }
          },
          error: function(err) {
            console.log('error from modelderivative - maybe needs translating');
          },
        });
      });
    });
    console.log(`pass viewer to callback : ${viewer}`);
    await callback(viewer);
  });
}

function objectNodeActivated(node){
  $("#forgeViewer").html(
    `<div class="card">
      <div class="card-header" id="objectViewHeader" data-toggle="tooltip">
        Objects
      </div>
      <div class="card-body" id="objectView">    
      </div>
    </div>
    `
  );
  const bucketObject = {
    bucketKey: node.parents[0],
    objectName: node.id,
    friendlyName: node.text,
  }
  // console.log('objectNodeActivated bucketObject ' + JSON.stringify(bucketObject));
  showObjectView([bucketObject]);
}

function nodeActivated(evt, data) {
  if (data != null && data.node != null){
    if(data.node.type == 'object') {    
      objectNodeActivated(data.node);
    }
  }
}

function prepareAppBucketTree() {
  $('#appBuckets').jstree({
    'core': {
      'themes': { "icons": true },
      'data': {
        "url": '/api/forge/oss/buckets',
        "dataType": "json",
        'multiple': false,
        "data": function (node) {
          return { "id": node.id };
        }
      }
    },
    'types': nodeTypesIcons,
    "plugins": ["types", "state", "sort", "contextmenu"],
    contextmenu: { items: autodeskCustomMenu }
  }).on('loaded.jstree', function () {
    $('#appBuckets').jstree('open_all');
  }).bind("activate_node.jstree", nodeActivated);
}

function autodeskCustomMenu(autodeskNode) {
  var items;

  switch (autodeskNode.type) {
    case "bucket":
      items = {
      };
      break;
    case "object":
      items = {
        addGeometry: {
          label: "Add Geometry",
          action: function () {
            addGeometryToObject();
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },
        edit2DpolygonTool: {
          label: "Edit 2d polygonTool",
          action: function () {
            draw2DEdit('polygonTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },   
        edit2DpolylineTool: {
          label: "Edit 2d polylineTool",
          action: function () {
            draw2DEdit('polylineTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },   
        edit2DmoveTool: {
          label: "Edit 2d moveTool",
          action: function () {
            draw2DEdit('moveTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },   
        edit2DpolygonEditTool: {
          label: "Edit 2d polygonEditTool",
          action: function () {
            draw2DEdit('polygonEditTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },   
        edit2DinsertSymbolTool: {
          label: "Edit 2d insertSymbolTool",
          action: function () {
            draw2DEdit('insertSymbolTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },   
        edit2DcopyTool: {
          label: "Edit 2d copyTool",
          action: function () {
            draw2DEdit('copyTool');
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },
        edit2DshowSvgPopup: {
          label: "Edit 2d showSvgPopup",
          action: function () {
            showSvgPopup();
          },
          icon: 'glyphicon glyphicon-plus-sign'
        },
      };
      break;
  }

  return items;
}

function addRedBox(modelBuilder, dbId) {
  const boxGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(10, 10, 10));
  const boxMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 0, 0) });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(-10, -10, 0),
    new THREE.Quaternion(0, 0, 0, 1),
    new THREE.Vector3(1, 1, 1)
  );
  boxMesh.dbId = dbId;
  modelBuilder.addMesh(boxMesh);
}

function addGreenSphere(modelBuilder, dbId) {
  const sphereGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(5, 8, 8));
  const sphereMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(0, 1, 0) });
  const sphereTransform = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, 0),
    new THREE.Quaternion(0, 0, 0, 1),
    new THREE.Vector3(1, 1, 1)
  );
  const sphereFragId = modelBuilder.addFragment(sphereGeometry, sphereMaterial, sphereTransform);
  modelBuilder.changeFragmentsDbId(sphereFragId, dbId);
}

function addBlueCyl(modelBuilder, dbId) {
  const cylinderGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(5, 5, 10));
  const cylinderMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(0, 0, 1) });
  const cylinderTransform = new THREE.Matrix4().compose(
    new THREE.Vector3(+10, +10, 0),
    new THREE.Quaternion(0, 0, 0, 1),
    new THREE.Vector3(1, 1, 1)
  );
  modelBuilder.addMaterial('MyCustomMaterial', cylinderMaterial);
  const cylinderGeomId = modelBuilder.addGeometry(cylinderGeometry);
  const cylinderFragId = modelBuilder.addFragment(cylinderGeomId, 'MyCustomMaterial', cylinderTransform);
  modelBuilder.changeFragmentsDbId(cylinderFragId, dbId);
}

// see https://forge.autodesk.com/blog/custom-models-forge-viewer
// for inspiration
async function addGeometryToObject() {
 
  if(viewer === undefined){
    console.log(`viewer is undefined, can't add geometry`);
    return;
  }
  console.log(`viewer is defined, start to add geometry`);
  const sceneBuilder = await viewer.loadExtension('Autodesk.Viewing.SceneBuilder');
  const modelBuilder = await sceneBuilder.addNewModel({ 
    conserveMemory: false, 
    modelNameOverride: 'My Custom Model', // where is this used?
  }); 
  addRedBox(modelBuilder, 123456);
  addGreenSphere(modelBuilder, 123456);
  addBlueCyl(modelBuilder, 456789);
  console.log(`modelBuilder.model = ${modelBuilder.model}`);
  viewer.fitToView([123456], modelBuilder.model);
}

// from https://forge.autodesk.com/en/docs/viewer/v7/developers_guide/advanced_options/edit2d-setup/
async function draw2DEdit(toolName){

  // Load Edit2D extension
  const options = {
    // If true, PolygonTool will create Paths instead of just Polygons. This allows to change segments to arcs.
    enableArcs: true
  };

  console.log('load Edit2D extension');
  const edit2d = await viewer.loadExtension('Autodesk.Edit2D');

  // Register all standard tools in default configuration
  edit2d.registerDefaultTools();




  // Code follows example above

  const ctx = edit2d.defaultContext;

  // {EditLayer} Edit layer containing your shapes
  ctx.layer

  // {EditLayer} An additional layer used by tools to display temporary shapes (e.g. dashed lines for snapping etc.)
  ctx.gizmoLayer

  // {UndoStack} Manages all modifications and tracks undo/redo history
  ctx.undoStack

  // {Selection} Controls selection and hovering highlight
  ctx.selection

  // {Edit2DSnapper} Edit2D snapper
  ctx.snapper


  // Facilitate access to extension and layer
  window.edit2d = NOP_VIEWER.getExtension('Autodesk.Edit2D');
  console.log('picked up the extension');

  window.layer  = edit2d.defaultContext.layer;
  window.tools  = edit2d.defaultTools;

  // Convenience function for tool switching per console. E.g. startTool(tools.polygonTool)
  var startTool = function(tool) {
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "repeated";
          }
          seen.add(value);
        }
        return value;
      };
    }; 
    console.log(`in startTool with tool = ${JSON.stringify(tool, getCircularReplacer)}`);

    var controller = NOP_VIEWER.toolController;

    // Check if currently active tool is from Edit2D
    var activeTool = controller.getActiveTool();
    var isEdit2D = activeTool && activeTool.getName().startsWith("Edit2");

    // deactivate any previous edit2d tool
    if (isEdit2D) {
      console.log(`there's a previous tool`);
      controller.deactivateTool(activeTool.getName());
      activeTool = null;
    }

    var box = NOP_VIEWER.model.getBoundingBox();  // typo in tutorial

    // Create simple triangle
    var poly = new Autodesk.Edit2D.Polygon([
      {x: 53, y: 24},
      {x: 62, y: 24},
      {x: 57, y: 34}
    ]);

    // Show it
    layer.addShape(poly);

    controller.activateTool(tool.getName());

    // stop editing tools
    if (!tool) {
      console.log('stop this tool');
      return;
    }
  }

  console.log(`tools.polygonTool = ${Object.getOwnPropertyNames(tools)}`);  
  //console.log(`window.tools = ${JSON.stringify(window.tools, getCircularReplacer)}`);

  if( toolName === 'polygonTool'){
    startTool(window.tools.polygonTool); // typo in tutorial
  } else if( toolName === 'polylineTool'){
    startTool(window.tools.polylineTool);
  } else if( toolName === 'moveTool'){
    startTool(window.tools.moveTool);
  } else if( toolName === 'polygonEditTool'){
    startTool(window.tools.polygonEditTool);
  } else if( toolName === 'insertSymbolTool'){
    startTool(window.tools.insertSymbolTool);
  } else if( toolName === 'copyTool'){
    startTool(window.tools.copyTool);
  } else  {
    aert(`tool name ${toolName} not recognised`);
  }
}

function showSvgPopup() {

  // window size
  const width = 400;
  const height = 400;

  // define pixel-scope as box2
  const pixelBox = new THREE.Box2();
  pixelBox.min.set(0, 0);
  pixelBox.max.set(width, height);


  const ctx = edit2d.defaultContext;
  const layer = ctx.layer

  console.log(`layer.shapes[0] = ${JSON.stringify(layer.shapes[0])}`);

  const augmentedShapes = layer.shapes.map((s)=>{
    s.isBezierArc = (i,j)=>{return false;}
    s.isEllipseArc = (i,j)=>{return false;}
    return s;
  });

  augmentedShapes.forEach((s)=>{
    for (let l=0; l<s.loopCount; l++) {
        const points = s._loops[l];

        for (let i=0; i<points.length; i++) {
            const p = points[i];

            // transform Bezier control points
            if (s.isBezierArc(i, l)) {                
              console.log('bezier');
            } else {
              console.log('not bezier');
            }

            // Transform ellipse arcs
            // Note: Currently, this only works for simple transforms (translate, rotate, uniform scale)
            if (s.isEllipseArc(i, l)) {
              console.log('ellipse');
            } else {
              console.log('not ellipse');
            }
        }
    }
  });

  // convert layer to svg element
  const svg = Autodesk.Edit2D.Svg.createSvgElement(
    augmentedShapes,
    { dstBox: pixelBox } // rescale to fit pixelBox [0,400]^2
  );

  // show in popup window
  const w = window.open('', '', `width=${width},height=${height}`);
  w.document.body.appendChild(svg);
  w.document.close();
};
