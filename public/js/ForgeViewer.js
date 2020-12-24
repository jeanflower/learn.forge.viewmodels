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
var viewer;

async function loadIntoViewer(urn) {
  console.log('loadIntoViewer urn');
  var documentId = 'urn:' + urn;
  Autodesk.Viewing.Document.load(
    documentId, 
    function (doc){
      console.log('onDocumentLoadSuccess');
      return onDocumentLoadSuccess(doc, viewer);
    },
    function (err){
      console.log('onDocumentLoadFailure');
      return onDocumentLoadFailure(err);
    },
  );
}

function onDocumentLoadSuccess(doc, viewer) {
  var viewables = doc.getRoot().getDefaultGeometry();
  viewer.loadDocumentNode(doc, viewables).then(i => {
    /*
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
    console.log('onDocumentLoadSuccess i = ' + JSON.stringify(i, getCircularReplacer()));
    */
  });
}

function onDocumentLoadFailure(viewerErrorCode) {
  console.log('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

function getForgeToken(callback) {
  fetch('/api/forge/oauth/token').then(res => {
    res.json().then(data => {
      console.log('got token ok');
      callback(data.access_token, data.expires_in);
    });
  });
}