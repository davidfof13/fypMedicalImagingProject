/** @file This file contains the scripts for when the draw event is activated. */

var draw_anno = null;
var query_anno = null;
//var allowed;

var draw_canv = null;
//var allowed;


// rectangle starting x, y positions
var startX = null; 
var startY = null;
var rectangle = null;
var rx = 0;
var ry = 0;

var offsetX, offsetY;
//courtesy of http://jsfiddle.net/m1erickson/7uNfW/



/** This function is called with the draw event is started.  It can be 
 triggered when the user (1) clicks on the base canvas. */
function StartDrawEvent(event) {

  draw_x = new Array();
  draw_y = new Array();


  if(main_media.GetFileInfo().GetMode() != "mt"){
    if (!CheckBeforeDrawing(event))
        return;

    // Get (x,y) mouse click location and button.
    var x = GetEventPosX(event);
    var y = GetEventPosY(event);

    // Move draw canvas to front:
    $('#draw_canvas').css('z-index','0');
    $('#draw_canvas_div').css('z-index','0');
  
    if(username_flag) submit_username();
  
    // Create new annotation structure:
    var numItems = $(LM_xml).children('annotation').children('object').length;
    draw_anno = new annotation(numItems);
  
    // Add first control point:
    draw_x.push(Math.round(x/main_media.GetImRatio()));
    draw_y.push(Math.round(y/main_media.GetImRatio()));
  
    // Draw polyline:
    draw_anno.SetDivAttach('draw_canvas');
    draw_anno.DrawPolyLine(draw_x, draw_y);
 
    // Set mousedown action to handle when user clicks on the drawing canvas:
    $('#draw_canvas_div').unbind();
    $('#draw_canvas_div').mousedown({obj: this},function(e) {
      return DrawCanvasMouseDown(e.originalEvent);
    });

    if (bounding_box){
      draw_anno.bounding_box = true;  
      $('#draw_canvas_div').mousemove({obj: this},function(e) {
        return DrawCanvasMouseMove(e.originalEvent);
      });
    }

    WriteLogMsg('*start_polygon');
  }

  else {

    $('#draw_canvas_div').css('cursor', 'default');

    // temporarily remove the draw_canvas element
    draw_canv = $('#draw_canvas').clone(true);
    $('#draw_canvas_div').empty();

    // Handles when user moves mouse
    $('#draw_canvas_div').mousemove(function(e) {

       if(rectangle != null){

          $(document).one("keyup", function(event) {


              if(rectangle!= null){
                if (event.keyCode == 27) { 

                  rectangle.style.width = 0;
                  rectangle.style.height = 0;
                  rectangle.parentNode.removeChild(rectangle);
                  rectangle = null;

                  $(this).off('keyup');
                  return; 

               }   // escape key maps to keycode `27`
            }
          });

         rx = parseInt(e.clientX + $(window).scrollLeft()  - offsetX);
         ry = parseInt(e.clientY + $(window).scrollTop() - offsetY);

         // set rectangle dimensions based on start end end co-ordinates
         rectangle.style.width = Math.abs(rx - startX)  + 'px';
         rectangle.style.height = Math.abs(ry - startY) + 'px';
         rectangle.style.left = (rx - startX < 0) ? rx + 'px' : startX + 'px';
         rectangle.style.top =  (ry - startY < 0) ? ry + 'px' : startY + 'px';

      }

    });


    // Handles when user closes the rectangle. 
    $('#draw_canvas_div').mousedown(function(e) {

        // start rectangle
        if(rectangle == null)
           DrawRectangle(e);

        else{ // close rectangle
          rectangle = null;
          active_canvas = REST_CANVAS;
         $('#draw_canvas_div').css('cursor', 'default');
          DrawCanvasCloseRectangle();
        }
    });

     DrawRectangle(event);

  } // end else


}

function CheckBeforeDrawing(event){

  if(!action_CreatePolygon || (active_canvas != REST_CANVAS)) return false;

  // Write message to the console:
  console.log('LabelMe: Starting draw event...');


  var button = event.button;
  
  // If the user does not left click, then ignore mouse-down action.
  if(button>1) return;

  // If we are hiding all polygons, then clear the main canvas:
  if(IsHidingAllPolygons) {
    for(var i = 0; i < main_canvas.annotations.length; i++) {
      main_canvas.annotations[i].hidden = true;
      main_canvas.annotations[i].DeletePolygon();
    }
  }

  // Set active canvas:
  active_canvas = DRAW_CANVAS;
  if (video_mode) oVP.Pause();


  var button = event.button;

  // ignore on right mouse click
  if(button>1) return false;

  return true;
}

function DrawRectangle(event){

  if(!CheckBeforeDrawing(event))
      return false;


  allowed = true;

  // Get starting co-ordinates. Courtesy of s
  // http://stackoverflow.com/questions/6460116/detecting-offset-of-an-element-on-scroll-in-javascript-jquery
  offsetX = $('#draw_canvas_div').offset().left;
  offsetY = $('#draw_canvas_div').offset().top;


  startX =  parseInt(event.pageX - offsetX);
  startY = parseInt(event.pageY - offsetY);

  console.log('startX = ' + startX + '. clientX = ' + event.clientX);
  console.log('startY = ' + startX + '. clientY = ' + event.clientY);


  // Move draw canvas to front:
  $('#draw_canvas_div').css('z-index','0');

  if(username_flag) submit_username();
  
  // Create new annotation structure:
  var numItems = $(LM_xml).children('annotation').children('object').length;
  draw_anno = new annotation(numItems);
  
  var scale = main_media.GetImRatio();

  // save co-ordinates
  draw_x.push(Math.round(startX/scale));
  draw_y.push(Math.round(startY/scale));


  rectangle = document.createElement('div');

  rectangle.className = 'rectangle';
  rectangle.style.left = startX + 'px';
  rectangle.style.top  = startY + 'px';
  $('#draw_canvas_div').append(rectangle);
  $('#draw_canvas_div').css('cursor' , 'crosshair');
}

function DrawCanvasMouseMove(event){
  draw_anno.DeletePolygon();
  var xb = GetEventPosX(event);
  var yb = GetEventPosY(event);
  var scale = main_media.GetImRatio();
  var xarr = [draw_x[0], Math.round(xb/scale), Math.round(xb/scale), draw_x[0], draw_x[0]];
  var yarr = [draw_y[0],draw_y[0], Math.round(yb/scale), Math.round(yb/scale), draw_y[0]];
  console.log(draw_anno);
  draw_anno.DrawPolyLine(xarr, yarr);

  /*DrawPolygon(draw_anno.div_attach,xarr, yarr,'drawing_bounding_box','stroke="#0000ff" stroke-width="4" fill-opacity="0.0"',scale);
  DrawPoint(draw_anno.div_attach,draw_x[0],draw_y[0],'r="6" fill="#00ff00" stroke="#ffffff" stroke-width="3"',scale);*/

}

function DrawCanvasCloseRectangle(){


    // Set active canvas:
    active_canvas = DRAW_CANVAS;


    // Save remaining corners of rectangle
    var scale = main_media.GetImRatio();

    // (sx, ry)
    draw_x.push(Math.round(startX/scale));
    draw_y.push(Math.round(ry/scale));

    // (rx, ry)
    draw_x.push(Math.round(rx/scale));
    draw_y.push(Math.round(ry/scale));

    // (rx, sy)
    draw_x.push(Math.round(rx/scale));
    draw_y.push(Math.round(startY/scale));

    // prompt user to save annotation
    DrawCanvasClosePolygon();

  // put back draw_canvas
    draw_canv.appendTo($('#draw_canvas_div'));
}

/** Handles when the user presses the mouse button down on the drawing
canvas. */
function DrawCanvasMouseDown(event) {

  // User right-clicked mouse, so close polygon and return:

  if(event.button > 1 && !bounding_box) return DrawCanvasClosePolygon();

  // Else, the user left-clicked the mouse.
  if(active_canvas!=DRAW_CANVAS) return;
  if(username_flag) submit_username();

  // Get (x,y) mouse location:
  var scale = main_media.GetImRatio();
  var x = Math.round(GetEventPosX(event)/scale);
  var y = Math.round(GetEventPosY(event)/scale);

  // Add point to polygon:
  
  if (bounding_box){

    $('#draw_canvas').find("a").remove();
    draw_x.push(x);
    draw_y.push(draw_y[0]);
    draw_x.push(x);
    draw_y.push(y);
    draw_x.push(draw_x[0]);
    draw_y.push(y);
    $('#draw_canvas_div').unbind("mousemove");
    DrawCanvasClosePolygon();
    return;
  } 
  else {
    draw_x.push(x);
    draw_y.push(y);
  }
  // Create array of line IDs if it is null:
  if(!draw_anno.line_ids) draw_anno.line_ids = Array();
  
  var line_idx = draw_anno.line_ids.length;
  var n = draw_x.length-1;
  

  // Draw line segment:
  draw_anno.line_ids.push(DrawLineSegment(draw_anno.div_attach,draw_x[n-1],draw_y[n-1],draw_x[n],draw_y[n],'stroke="#0000ff" stroke-width="4"',scale));


  // Set cursor to be crosshair on line segment:
  $('#'+draw_anno.line_ids[line_idx]).css('cursor','crosshair');
  
  // Move the first control point to be on top of any drawn lines.
  $('#'+draw_anno.div_attach).append($('#'+draw_anno.point_id));

  
}    

/** Handles when the user closes the polygon by right-clicking or clicking 
 on the first control point. For video events the bubble is slightly different
*/
function DrawCanvasClosePolygon() {
  if(active_canvas!=DRAW_CANVAS) return;
  if(username_flag) submit_username();
  if((object_choices!='...') && (object_choices.length==1)) {
    main_handler.SubmitQuery();
    StopDrawEvent();
    return;
  }
  active_canvas = QUERY_CANVAS;
  
  // Move draw canvas to the back:
  //document.getElementById('draw_canvas').style.zIndex = -2;

  document.getElementById('draw_canvas_div').style.zIndex = -2;
  
  // Remove polygon from the draw canvas:
  var anno = null;

  if(draw_anno) {
    console.log(draw_anno.first_point)
    draw_anno.DeletePolygon();
    anno = draw_anno;
    draw_anno = null;
  }
  // Move query canvas to front:
  //document.getElementById('query_canvas').style.zIndex = 0;
  document.getElementById('query_canvas_div').style.zIndex = 0;
  
  // Set object list choices for points and lines:
  var doReset = SetObjectChoicesPointLine(draw_x.length);

  // Get location where popup bubble will appear:
  var pt = main_media.SlideWindow(Math.round(draw_x[0]*main_media.GetImRatio()),Math.round(draw_y[0]*main_media.GetImRatio()));

  var lmode = main_media.GetFileInfo().GetMode();

  // Make query popup appear.
  main_media.ScrollbarsOff();
  WriteLogMsg('*What_is_this_object_query');

  var html_str = "";

  if (video_mode && lmode != "mt"){

    var html_str = "<b>Enter object name</b><br />";
    html_str += HTMLobjectBox("");
    
    if(use_attributes) {
      html_str += HTMLoccludedBox("");
      html_str += "<b>Enter attributes</b><br />";
      html_str += HTMLattributesBox("");
    }
    if(use_parts) {
      html_str += HTMLpartsBox("");
    }
    html_str += "<br />";
  
    // Done button:
    html_str += '<input type="button" value="Done" title="Press this button after you have provided all the information you want about the object." onclick="main_media.SubmitObject();" tabindex="0" />';
  
    // Undo close button:
    if (!bounding_box) html_str += '<input type="button" value="Undo close" title="Press this button if you accidentally closed the polygon. You can continue adding control points." onclick="UndoCloseButton();" tabindex="0" />';
  
    // Delete button:
    html_str += '<input type="button" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.WhatIsThisObjectDeleteButton();" tabindex="0" />';
    


    wait_for_input = 1;
    CreatePopupBubble(pt[0],pt[1], html_str, 'main_section');
  } 
  else mkPopup(pt[0],pt[1]);
  
  // If annotation is point or line, then 
  if(doReset) object_choices = '...';
  
  // Render annotation:
  query_anno = anno;
  query_anno.SetDivAttach('query_canvas');
  FillPolygon(query_anno.DrawPolygon(main_media.GetImRatio(), draw_x, draw_y));
}

/** Handles when the user presses the undo close button in response to
 the "What is this object?" popup bubble. */
function UndoCloseButton() {
  active_canvas = DRAW_CANVAS;
  
  // Move query canvas to the back:
  document.getElementById('query_canvas').style.zIndex = -2;
  document.getElementById('query_canvas_div').style.zIndex = -2;
  
  // Remove polygon from the query canvas:
  query_anno.DeletePolygon();
  var anno = query_anno;
  query_anno = null;
  
  CloseQueryPopup();
  main_media.ScrollbarsOn();
  
  // Move draw_canvas to front:
  document.getElementById('draw_canvas').style.zIndex = 0;
  document.getElementById('draw_canvas_div').style.zIndex = 0;

  // Draw polyline:
  draw_anno = anno;
  draw_anno.SetDivAttach('draw_canvas');
  draw_anno.DrawPolyLine(draw_x, draw_y);
}

/** This function is called when the draw event is finished.  It can be
 triggered when the user (1) closes the polygon and only one option is
 valid in the drop-down list (2) erases the last control point.
*/
function StopDrawEvent() {
  // Set active canvas:
  active_canvas = REST_CANVAS;
  if (video_mode) oVP.Play();
  // Move draw canvas to the back:
  $('#draw_canvas').css('z-index','-2');
  $('#draw_canvas_div').css('z-index','-2');

  // Remove polygon from draw canvas:
  if(draw_anno) {
    draw_anno.DeletePolygon();
    draw_anno = null;
  }

  // Write message to the console:
  console.log('LabelMe: Stopped draw event.');
}
