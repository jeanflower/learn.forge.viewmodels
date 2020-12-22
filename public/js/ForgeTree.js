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

  $('#createNewBucket').click(function () {
    createNewBucket();
  });

  $('#createBucketModal').on('shown.bs.modal', function () {
    $("#newBucketKey").focus();
  })

  $('#hiddenUploadField').change(function () {
    // console.log('hiddenUploadField has changed ');
    var node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var _this = this;
    if (_this.files.length == 0) return;
    var file = _this.files[0];
    switch (node.type) {
      case 'bucket':
        var formData = new FormData();
        formData.append('fileToUpload', file);
        formData.append('bucketKey', node.id);

        $.ajax({
          url: '/api/forge/oss/objects',
          data: formData,
          processData: false,
          contentType: false,
          type: 'POST',
          success: function (data) {
            $('#appBuckets').jstree(true).refresh_node(node);
            _this.value = '';
          }
        });
        break;
    }
  });
});

function createNewBucket() {
  var bucketKey = $('#newBucketKey').val();
  var policyKey = $('#newBucketPolicyKey').val();
  jQuery.post({
    url: '/api/forge/oss/buckets',
    contentType: 'application/json',
    data: JSON.stringify({ 'bucketKey': bucketKey, 'policyKey': policyKey }),
    success: function (res) {
      $('#appBuckets').jstree(true).refresh();
      $('#createBucketModal').modal('toggle');
    },
    error: function (err) {
      if (err.status == 409)
        alert('Bucket already exists - 409: Duplicated')
      console.log(err);
    }
  });
}

function showNotYetTranslated(err, viewerTag) {
  var msgButton = 'This file is not translated yet! ' +
    '<button ' +
    'class="btn btn-xs btn-info" ' + 
    'onclick="translateObject()"' + 
    '>' + 
    '<span class="glyphicon glyphicon-eye-open"></span> ' +
    'Start translation' + 
    '</button>'
  $(viewerTag).html(msgButton);
}

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
function showObjectView(viewData){
  viewData.forEach(function(x){
    const viewerTag = x.viewTag;
    const urn = x.urn;
    $(viewerTag).empty();
    // console.log('showObjectView for urn = ' + urn + ' in element for tag = ' + viewerTag);
    getForgeToken(function (access_token) {
      const url = 
        'https://developer.api.autodesk.com/modelderivative/v2/designdata/' +
        urn +
        '/manifest';
      jQuery.ajax({
        url: url,
        headers: { 'Authorization': 'Bearer ' + access_token },
        success: function (res) {
          if (res.progress === 'success' || res.progress === 'complete') {
            // console.log('launch a viewer in element for tag = ' + viewerTag);
            launchViewer(urn, viewerTag);
          } else {
            $(viewerTag).html(
              'The translation job is still running: ' +
              res.progress +
              '. Please try again in a moment.'
            );
          }
        },
        error: function(err) {
          showNotYetTranslated(err, viewerTag) 
        },
      });
    });
  });
}
function objectNodeActivated(node){
  // $("#forgeViewer").empty();
  $("#forgeViewer").html(
    `<div class="card">
      <div class="card-header" data-toggle="tooltip">
        Objects
      </div>
      <div class="card-body" id="objectView">    
      </div>
    </div>
    `
  );
  // console.log('node ' + JSON.stringify(node));
  showObjectView([{urn:node.id, viewTag:'objectView'}]);
}
function bucketNodeActivated(node){
  $("#forgeViewer").empty();
  // console.log('clicked a bucket with' + JSON.stringify(node));
  $("#forgeViewer").html(
    `<div class="card">
      <div class="card-header" data-toggle="tooltip">
        Objects
      </div>
      <div class="card-body">
        <div class="container-fluid fill">
          <div class="row">
            <div class="col-6 col-sm-3 fill" id="child0"></div>
            <div class="col-6 col-sm-3 fill" id="child1"></div>
            <div class="col-6 col-sm-3 fill" id="child2"></div>
          </div>
          <div class="row">
            <div class="col-6 col-sm-3 fill" id="child3"></div>
            <div class="col-6 col-sm-3 fill" id="child4"></div>
          </div>
        </div>
      </div>
    </div>    
    `
  );

  var children = $("#appBuckets").jstree("get_children_dom",node);
  // console.log('jstree node children[0] = ' + JSON.stringify(childrens[0]));
  // console.log('jstree node children[0].innerText = ' + childrens[0].innerText);
  // console.log('jstree node children[0].id = ' + childrens[0].id);

  var viewData = Array.from({length:children.length},(v,k)=>k+1).map(function(i){
    return {urn:children[i].id, viewTag:'child'+i}
  })

  console.log('viewData is ' + JSON.stringify(viewData));
  showObjectView(viewData);
}
function nodeActivated(evt, data) {
  if (data != null && data.node != null){
    if(data.node.type == 'object') {    
      objectNodeActivated(data.node);
    } else if(data.node.type == 'bucket') {
      bucketNodeActivated(data.node);
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
        uploadFile: {
          label: "Upload file",
          action: function () {
            uploadFile();
          },
          icon: 'glyphicon glyphicon-cloud-upload'
        },
        deleteBucket: {
          label: "Delete bucket",
          action: function () {
            deleteBucket();
          },
          icon: 'glyphicon glyphicon-trash'
        },
      };
      break;
    case "object":
      items = {
        translateFile: {
          label: "Translate",
          action: function () {
            var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
            translateObject(treeNode);
          },
          icon: 'glyphicon glyphicon-eye-open'
        },
        deleteFile: {
          label: "Delete",
          action: function () {
            var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
            deleteObject(treeNode);
          },
          icon: 'glyphicon glyphicon-trash'
        },
      };
      break;
  }

  return items;
}

function uploadFile() {
  $('#hiddenUploadField').click();
}

function deleteBucket() {
  var node = $('#appBuckets').jstree(true).get_selected(true)[0];
  var _this = this;
  switch (node.type) {
    case 'bucket':
      // console.log('we want to delete bucket ' + node.id);
      $.ajax({
        url: '/api/forge/oss/delbucket?' + $.param({"bucketKey": node.id}),
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
          // console.log('success reported from deleting bucket ' + node.id);
          $('#appBuckets').jstree(true).refresh();
          _this.value = '';
        },
        error: function (err) {
          console.log(err);
        }          
      });
      break;
  }
}

function translateObject(node) {
  $("#forgeViewer").empty();
  if (node == null) {
    node = $('#appBuckets').jstree(true).get_selected(true)[0];
  }
  var bucketKey = node.parents[0];
  var objectName = node.id;
  jQuery.post({
    url: '/api/forge/modelderivative/jobs',
    contentType: 'application/json',
    data: JSON.stringify({ 'bucketKey': bucketKey, 'objectName': objectName }),
    success: function (res) {
      $("#forgeViewer").html('Translation started! Please try again in a moment.');
    },
  });
}

function deleteObject(node) {
  if (node == null) {
    node = $('#appBuckets').jstree(true).get_selected(true)[0];
  }
  if(node.type == 'object'){
    var bucketKey = node.parents[0];
    // in router.get('/buckets'.., we put object.objectKey as node.text
    var objectName = node.text;
    var _this = this;
    const url = '/api/forge/oss/delobject?bucketKey=' + 
      bucketKey + 
      '&objectName=' + 
      objectName;
    $.ajax({
      url: url,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function (data) {
        // console.log('success reported from deleting object ' + node.id);
        $('#appBuckets').jstree(true).refresh();
        $("#forgeViewer").empty();
        _this.value = '';
      },
      error: function (err) {
        console.log(err);
      }          
    });
  }
}
