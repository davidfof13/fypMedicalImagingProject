/** @file This file contains the scripts used when LabelMe starts up. */

/** Main entry point for the annotation tool. */
function StartupLabelMe() {
  console.time('startup');

  // Check browser:
  GetBrowserInfo();
  if(IsNetscape() || (IsMicrosoft() && (bversion>=4.5)) || IsSafari() || IsChrome()) {
    // Write "start up" messageskey: "value", 
    WriteLogMsg('*start_loading');
    console.log('LabelMe: starting up...');
    
    // Initialize global variables:
    main_handler = new handler();
    main_canvas = new canvas('myCanvas_bg');
    main_media = new image('im');

    // main media file Info
    var mmInfo = main_media.GetFileInfo();
    var mode = mmInfo.GetMode();
    // Parse the input URL.  Returns false if the URL does not set the 
    // annotation folder or image filename.  If false is returned, the 
    // function fetches a new image and sets the URL to reflect the 
    // fetched image.
    if(!mmInfo.ParseURL()){

      return;
    }

    if(video_mode) {
      main_media = new video('videoplayer');
      mmInfo.ParseURL();
      console.log("Video mode...");
      var anno_file = main_media.GetFileInfo().GetFullName();
      main_media.GetNewVideo();
      anno_file = 'VLMAnnotations/' + anno_file + '.xml' + '?' + Math.random();
      ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);
    }

    else {
      // This function gets run after image is loaded:
      function main_media_onload_helper() {
	    

           // Display Image
           main_media.SetImageDimensions();
           $(".image_canvas").appendTo("#hit-image");


           $(document).ready(function() {


             // Resize image for mTurk 
            if(mmInfo.GetMode() == "mt"){

                // configure actions for hit menu
                main_handler.setHITMenu();

                // Prevent click of <a> tag from  resetting the screen 
                // position and adding random characters to the URL
                $('a').click(function(e){    
                   e.preventDefault();
                });


                var imH = $('#main_media').innerHeight();
                //$('#hit-bottom').css('height', imH);
                //$('#arrow').css('margin-bottom', Math.round(0.12*imH));
                //$('#arrow').css('margin-top', Math.round(0.08*imH));

            } 

            // Read the XML annotation file:
            var anno_file = main_media.GetFileInfo().GetFullName();
            anno_file = 'Annotations/' + anno_file.substr(0,anno_file.length-4) + '.xml' + '?' + Math.random();
            ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);

          });
      
      };

        // Get the image:
        main_media.GetNewImage(main_media_onload_helper);

    }
  }
  else {
    // Invalid browser, so display error page.
    $('body').remove();
    $('html').append('<body><p><img src="Icons/LabelMe.gif" /></p><br /><p>Sorry!  This page only works with Mozilla Firefox, Chrome, and Internet Explorer.  We may support other browsers in the future.</p><p><a href="http://www.mozilla.org">Download Mozilla Firefox?</a></p></body>');
  }
}

/** This function gets called if the annotation has been successfully loaded.
  * @param {string} xml - the xml regarding the current file
*/
function LoadAnnotationSuccess(xml) {
  

  console.time('load success');

  //if (main_media.GetFileInfo().GetMode() != "mt"){ 

    // Set global variable:
    LM_xml = xml;

    // Set AllAnnotations array:
    SetAllAnnotationsArray();

    console.time('attach main_canvas');
    // Attach valid annotations to the main_canvas:
    for(var pp = 0; pp < LMnumberOfObjects(LM_xml); pp++) {
      var isDeleted = LMgetObjectField(LM_xml, pp, 'deleted');
      if(((view_Existing&&!isDeleted)||(isDeleted&&view_Deleted)) &&
	($(LM_xml).children("annotation").children("object").children("slicsegm").length == 0)) {

        // Attach to main_canvas:
       	main_canvas.AttachAnnotation(new annotation(pp));
        if (!video_mode && LMgetObjectField(LM_xml, pp, 'x') == null){
         main_canvas.annotations[main_canvas.annotations.length -1].SetType(1);
         main_canvas.annotations[main_canvas.annotations.length -1].scribble = new scribble(pp);
        }
      }
    }
    console.timeEnd('attach main_canvas');

    console.time('RenderAnnotations()');
    // Render the annotations:
    main_canvas.RenderAnnotations();
    console.timeEnd('RenderAnnotations()');

    console.timeEnd('load success');
  //}

    // Finish the startup scripts:
    FinishStartup();
}

/** Sets AllAnnotations array from LM_xml */
function SetAllAnnotationsArray() {

  var obj_elts = LM_xml.getElementsByTagName("object");
  var num_obj = obj_elts.length;
  
  num_orig_anno = num_obj;

  console.time('initialize XML');
  // Initialize any empty tags in the XML file:
  for(var pp = 0; pp < num_obj; pp++) {
    var curr_obj = $(LM_xml).children("annotation").children("object").eq(pp);

    // Initialize object name if empty in the XML file:
    if(curr_obj.children("name").length == 0) LMsetObjectField(LM_xml, pp, "name","");

    // Set object IDs:
    LMsetObjectField(LM_xml, pp, "id", pp.toString());


    /*************************************************************/
    /*************************************************************/
    // Scribble: 
    // Initialize username if empty in the XML file. Check first if we 
    // have a polygon or a segmentation:
    if(curr_obj.children("polygon").length == 0) { // Segmentation
      if(curr_obj.children("segm").children("username").length == 0) {
        curr_obj.children("segm").append($("<username>anonymous</username>"));

      }
      else if(curr_obj.children("polygon").children("username").length == 0) curr_obj.children("polygon").append($("<username>anonymous</username>"));
      /*************************************************************/
      /*************************************************************/
    }
    console.timeEnd('initialize XML');

    console.time('addPartFields()');
    // Add part fields (this calls a funcion inside object_parts.js)
    addPartFields(); // makes sure all the annotations have all the fields.
    console.timeEnd('addPartFields()');


    console.time('loop annotated');
  
     console.timeEnd('loop annotated');
   }

}

/** Annotation file does not exist, so load template. */
function LoadAnnotation404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404) 
    ReadXML(main_media.GetFileInfo().GetTemplatePath(),LoadTemplateSuccess,LoadTemplate404);
  else
    alert(jqXHR.status);
}

/** Annotation template does not exist for this folder, so load default */
function LoadTemplate404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404)
    ReadXML('annotationCache/XMLTemplates/labelme.xml',LoadTemplateSuccess,function(jqXHR) {
	alert(jqXHR.status);
      });
  else
    alert(jqXHR.status);
}

/** Actions after template load success 
  * @param {string} xml - the xml regarding the current file
*/
function LoadTemplateSuccess(xml) {
  // Set global variable:
  LM_xml = xml;

  // Set folder and image filename:
  LM_xml.getElementsByTagName("filename")[0].firstChild.nodeValue = '\n'+main_media.GetFileInfo().GetImName()+'\n';
  LM_xml.getElementsByTagName("folder")[0].firstChild.nodeValue = '\n'+main_media.GetFileInfo().GetDirName()+'\n';

  // Set global variable:
  num_orig_anno = 0;

  // Finish the startup scripts:
  FinishStartup();
}

/** Finish the startup process: */
function FinishStartup() {
  // Load the annotation list on the right side of the page:
  if(view_ObjList) RenderObjectList();

  // Add actions:
  console.log('LabelMe: setting actions');
  if($('#img_url')) $('#img_url').attr('onclick','javascript:console.log(\'bobo\');location.href=main_media.GetFileInfo().GetImagePath();');
  $('#changeuser').attr("onclick","javascript:show_enterUserNameDIV(); return false;");
  $('#userEnter').attr("onkeyup","javascript:var c; if(event.keyCode)c=event.keyCode; if(event.which)c=event.which; if(c==13 || c==27) changeAndDisplayUserName(c);");
  $('#xml_url').attr("onclick","javascript:GetXMLFile();");

  if (main_media.GetFileInfo().GetMode() != "mt")
    $('#nextImage').attr("onclick","javascript:ShowNextImage()");

  else{
   
    $('#arrowCont').click(function(){

      if(global_count == 0){

        alert("You need to provide at least one label for this image.");
        return;
      }

      drawing_mode = 2; 
      if (segmentAnnotator != null) main_handler.SubmitQuery(); 
        ShowNextImage();
    });

  }



  $('#zoomin').attr("onclick","javascript:main_media.Zoom(1.15)");
  $('#zoomout').attr("onclick","javascript:main_media.Zoom(1.0/1.15)");
  $('#fit').attr("onclick","javascript:main_media.Zoom('fitted')");
  $('#erase').attr("onclick","javascript:main_handler.EraseSegment()");
  $('#myCanvas_bg_div').attr("onmousedown","javascript:StartDrawEvent(event);return false;");
  $('#myCanvas_bg_div').attr("oncontextmenu","javascript:return false;");
  $('#myCanvas_bg_div').attr("onmouseover","javascript:unselectObjects();");
  $('#select_canvas_div').attr("oncontextmenu","javascript:return false;");
  $('#query_canvas_div').attr("onmousedown","javascript:event.preventDefault();WaitForInput();return false;");
  $('#query_canvas_div').attr("onmouseup","javascript:event.preventDefault();");
  $('#query_canvas_div').attr("oncontextmenu","javascript:return false;");



  // Initialize the username:
  initUserName();

  // Enable scribble mode:
  InitializeAnnotationTools('label_buttons_drawing','main_media');
  
  // Set action when the user presses a key:
  document.onkeyup = main_handler.KeyPress;
  
  // Collect statistics:
  ref = document.referrer;

  // Write "finished" messages:
  WriteLogMsg('*done_loading_' + main_media.GetFileInfo().GetImagePath());
  console.log('LabelMe: finished loading');

  console.timeEnd('startup');

  if(main_media.GetFileInfo().GetMode() == "mt"){


    // Refresh page
    if($(".image_canvas").parent().attr('id') != "hit-image"){
        window.location = document.URL;
        return;
    }
    // if the mTurk div element has been activated then move the image
    if (document.getElementById('mt_submit_form').style.visibility == 'visible'){
        $(".image_canvas").css({position: 'relative'});  

    }

     // For firefox
    if (IsNetscape()){
          document.getElementById("mtComments").remove();
         document.getElementById("feedBackTxt").remove();
    }

  }
  

}

// re-positions the image canvas for the MTurk
// worker page
function repositionImageCanvas(ele){

  var target = document.getElementById("image_canvas");
  e.parentNode.replaceChild(target, e);
}


// Initialize the segmentation tool. This function is called when the field 
// scribble of the url is true
function InitializeAnnotationTools(tag_button, tag_canvas){
    if (scribble_mode) scribble_canvas = new scribble_canvas(tag_canvas);
    var html_str = '<div id= "polygonDiv" class="annotatemenu">Polygon<br></br>Tool \
        <button id="polygon" class="labelBtnDraw" type="button" title="Start Polygon" onclick="SetPolygonDrawingMode(false)" > \
        <img id="polygonModeImg" src="Icons/polygon.png"  width="28" height="38" /> \
        </button> \
        <button id="erase" class="labelBtnDraw" type="button" title="Delete last segment" onclick="main_handler.EraseSegment()" > \
        <img src="Icons/erase.png"  width="28" height="38" /> \
        </button> ';
        if (bbox_mode) html_str += ' <button id="bounding_box" class="labelBtnDraw" type="button" title="Delete last segment" onclick="SetPolygonDrawingMode(true)" > \
        <img src="Icons/bounding.png"  width="28" height="38" /> \
        </button> ';
    html_str += '</div>';

    html_str += '<div id= "segmDiv" class="annotatemenu">Mask<br></br>Tool \
        <button id="ScribbleObj" class="labelBtnDraw" type="button" title="Use the red pencil to mark areas inside the object you want to segment" onclick="scribble_canvas.setCurrentDraw(OBJECT_DRAWING)" > \
        <img src="Icons/object.png" width="28" height="38" /></button> \
        <button id="ScribbleBg" class="labelBtnDraw" type="button" title="Use the blue pencil to mark areas outside the object" onclick="scribble_canvas.setCurrentDraw(BG_DRAWING)" > \
        <img src="Icons/background.png" width="28" height="38" /></button> \
        <button id="ScribbleRubber" class="labelBtnDraw" type="button" title="ScribbleRubber" onclick="scribble_canvas.setCurrentDraw(RUBBER_DRAWING)" > \
        <img src="Icons/erase.png" width="28" height="38" /> \
        </button><input type="button" class="segbut" id="segmentbtn" value="Process" title="Press this button to see the segmentation results." onclick="scribble_canvas.segmentImage(0)"/><input type="button" class="segbut"  id="donebtn" value="Done" title="Press this button after you are done with the scribbling." onclick="scribble_canvas.segmentImage(1)"/> \
        <p> </p><div id="loadspinner" style="display: none;"><img src="Icons/segment_loader.gif"/> </div></div>';

    $('#'+tag_button).append(html_str);    

    var html_str2 = '<button xmlns="http://www.w3.org/1999/xhtml" id="img_url" class="labelBtn" type="button" title="Download Pack" onclick="javascript:GetPackFile();"> \
        <img src="Icons/download_all.png" height="30" /> \
        </button>';

    var html_str3 = '<form action="annotationTools/php/getpackfile.php" method="post" id="packform"> \
        <input type="hidden" id= "folder" name="folder" value="provesfinal" /> \
        <input type="hidden" id= "name" name="name" value="img2.jpg" /> \
       </form>';

    $('#tool_buttons').append(html_str3);
    $('#help').before(html_str2); 

    var segmDiv = document.getElementById("segmDiv");

    
    if(segmDiv){
      segmDiv.setAttribute('style', 'opacity: 1');
      document.getElementById("polygon").setAttribute('style', 'background-color: #faa');
      document.getElementById("polygonDiv").setAttribute('style', 'opacity: 1');
      document.getElementById("segmDiv").setAttribute('style', 'border-color: #000');
      document.getElementById("polygonDiv").setAttribute('style', 'border-color: #f00');
    }
}

// Switch between polygon scribble and region selection mode. If a polygon is open 
// or the user  is in the middle of the segmentation an alert appears to indicate so.
function SetDrawingMode(mode){
  if (drawing_mode == mode || active_canvas == QUERY_CANVAS) return;

  // Get LabelMe Mode
  var lmode = main_media.GetFileInfo().GetMode();
  

  // Changing to polygon mode
  if (mode == 0){ 

    if (scribble_canvas.annotationid != -1){
      alert("You can't change drawing mode while editting scribbles.");
      return;
    } else if( $('#segmA').hasClass('active') ){
      alert("You need to preview your scribbles first (click Preview on the left) and decide if you want to save, continue editing them or delete them.");
      return;
    }


    if(lmode != "mt"){
        document.getElementById("segmDiv").setAttribute('style', 'border-color: #000');
        document.getElementById("polygonDiv").setAttribute('style', 'border-color: #f00');

        // removes scribbles when we move to polygon drawing
        scribble_canvas.scribble_image = "";
        scribble_canvas.cleanscribbles();
        scribble_canvas.CloseCanvas();

    } else {

        // put scribble canvas underneath
        $('#myCanvas_bg_div').append($('#scribbleDiv'));
        $('#scribbleDiv').css('z-index', '-2');


        //document.getElementById("edit-menu").style.visibility = 'hidden';
        hideRegionDiv();
    }
  }
  

  // changing to scribble mode
  if (mode == 1) { 
    if(draw_anno) {
      alert("Need to close current polygon first.");
      return;
    }

   
    if(lmode != "mt"){
    
      document.getElementById("segmDiv").setAttribute('style', 'border-color: #f00');
      document.getElementById("polygonDiv").setAttribute('style', 'border-color: #000');
    }  else {
        hideRegionDiv();
    }
    scribble_canvas.startSegmentationMode();
  }

  // changing to region selection
  if(mode == 2){

      // check polygon
      if(draw_anno) {
        alert("Need to close current polygon first.");
        return;
      }

      // check scribble
      if (scribble_canvas.annotationid != -1){
        alert("You can't change drawing mode while editting scribbles.");
        return;
      } else if( $('#segmA').hasClass('active') ){
        alert("You need to preview your scribbles first (click Preview on the left) and decide if you want to save, continue editing them or delete them.");
        return;
      }

     
      // put scribble canvas underneath
      $('#myCanvas_bg_div').append($('#scribbleDiv'));
      $('#scribbleDiv').css('z-index', '-2');


      // put new div on top
      setUpRegionSelection();
  }

  drawing_mode = mode;
}

function hideRegionDiv(){

    if(!segmentAnnotator) return;

    // display the original image
    segmentAnnotator.setFillAlpha(0);
    segmentAnnotator.setBoundaryAlpha(0);

    // want to display the whole image clearly
    document.getElementById("regionDiv").style.display = "none";

    // put region selection canvas underneath
    $('#myCanvas_bg_div').append($('#regionDiv'));
    $('#regionDiv').css('z-index', '-3');
}

function setUpRegionSelection(){

  // if the region canvas already exists, move it back on top
  if($('#regionDiv').length){

        // restore SLIC segmentation of image
        segmentAnnotator.setFillAlpha(128);
        segmentAnnotator.setBoundaryAlpha(192);

        document.getElementById("regionDiv").style.display = "block";

        $('#regionDiv').css('z-index', 1);
        $('#' + scribble_canvas.tagscribbleDiv).append($('#regionDiv'));

  } else{

    // create new div
    html_str = '<div id="regionDiv" ';
    html_str+='style="position:absolute;left:0px;top:0px;z-index:1;width:100%;height:100%;background-color:rgba(128,64,0,0);">';
    html_str+='</div>';

    // add to main media
    $('#'+ scribble_canvas.tagscribbleDiv).append(html_str);


    segmentAnnotator =  new SLICSegmentAnnotator(main_media.file_info.GetImagePath(), {
        regionSize: 40,
        container: document.getElementById('regionDiv'),
        // annotation: 'annotation.png' // optional existing annotation data.
        labels: [{name: 'background', color: [255, 255, 255]},'object'],
        onload: function() {initializeLegend(this);}
    });

  }

}
function SetPolygonDrawingMode(bounding){
  if (active_canvas == QUERY_CANVAS) return;
  if(draw_anno) {
      alert("Need to close current polygon first.");
      return;
  }
  var buttons = document.getElementsByClassName("labelBtnDraw");
  for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('style', 'background-color: #fff');
  if (!bounding) document.getElementById("polygon").setAttribute('style', 'background-color: #faa');
  else document.getElementById("bounding_box").setAttribute('style', 'background-color: #faa');
  bounding_box = bounding;
  SetDrawingMode(0);

}


/** MTurk mode: changes the user login form of the modal entity and 
shows the first instruction page */
function showInstructionsModal(name) {

        
        var html_str = '<div class="modal-dialog">';
        html_str += '<div class="modal-content">';
        html_str += '<div class="modal-header">';
        html_str += '<h4 class="modal-title">Instructions</h4>';
        html_str += '</div>';
        html_str += '<div class="modal-body">';
        html_str += '<p>Welcome <strong>' + name + '</strong>. \
         <span style="color: red;">PLEASE READ THE INSTRUCTIONS BELOW!</span>:</p>';
  

        html_str += '<h4>Aim</h4>';
        html_str +='<p>The purpose of this exercise is to <span style="color: red;">label </span> objects in medical images. Labelling \
        just means that you have to mark one or more specific areas in the image, that are of interest to us. In this case, \
        we\'re interested in locating small objects such as brain tumours and we want you to annotate these objects \
        <span style="color: red;"> as accurately as possible </span>. The example below shows what we\'re looking for: \
        </p>';

        html_str +='<p> \(Insert Images here\ and give example of correct labelling\) </p>';

        html_str += '<p>Don\'t worry about getting your labels wrong. Any annotation that you make provides additional information \
        that will contribute to the team\'s research.  You will be given ' + MTimCounter + ' images to label and you will have three \
        labelling commands at your disposal: you can draw <span style="color: red;" >rectangular boxes , scribbles</span> or you can \
        select one or many <span style="color: red;" >regions</span> that contain the object.</p>';

        html_str += '<p>You can use any of them, and combine any, it\'s completely up to you. Sometimes you may need to use \
        all of them as it will give us more information about the location and the shape of the object. At other times, \
        one may only be necessary</p>';

        html_str += '<h4>Drawing</h4>';

        html_str += 'The \'Draw\' menu which is seen on the left hand side will allow you to select and switch between \
        the different labelling commands.'

        html_str += '<h4>Editing</h4>';

        html_str += '<p> Each labelling command will have their own editing commands. For all of them, editing is done \
        instantly. After drawing an object with boxes or scribbles , you have the choice of deleting, saving (accept) or \
        continue editing the object. For the \'Regions\' command, you can click on a region to select it and click on it \
        again to unselect it. </p>';

        html_str += '<div class="modal-footer"> \
        <button type="button" class="btn btn-primary" onmousedown="showInstructionsModal2();">Next</button> \
        </div>';

        html_str +='</div>';
        html_str += '</div>';
        html_str += '</div>';


        document.getElementById("myModal").innerHTML = html_str;
 }


/** MTurk mode: shows the second instruction page
of the instruction modal */
function showInstructionsModal2() {

  var html_str = '<div class="modal-dialog">';
  
  html_str += '<div class="modal-content">';
  html_str += '<div class="modal-header">';
  html_str += '<h4 class="modal-title">Instructions</h4>';
  html_str += '</div>';
  html_str += '<div class="modal-body">';

  html_str += '<h4>Scribble tool</h4>';

  html_str += '<p> Use the <span style="color: red;">foreground</span> command to circle the object of interest and \
  use the <span style="color: red;">background </span> command to indicate the areas that we should ignore. \
  For example: </p> (Insert Images here) ';


  html_str += '<h4>Regions tool</h4>';


  html_str += '<p> The subcommands <span style="color: red;">original, unbounded, boundary</span> and <span style="color: red;"> \
  color mask</span> allow you to visualize the image using different effects making it sometimes easier to label the image. The \
  <span style="color: red;">resolution</span> command allows you to change the size of the regions. You can adjust its value to \
  have smaller or larger regions to label more accurately. For example: </p> (Insert Images here)';

  html_str += '<h4>Submitting results</h4>';

  html_str += '<p>As previously mentioned, you have '+ MTimCounter + ' images to label. When you\'re finished with \
  one, click on the \'Next Image\' button on the right hand side to proceed to the next image. The \
  submit button will be enabled when you\'ve labelled all images and you can click on it to submit your \
  results. That\'s it!</p>';

  html_str += '<p>Press the Start button below to begin the task</p><p></p>';

  html_str += '<div class="modal-footer"> \
  <button type="button" class="btn" onmousedown="showInstructionsModal(username);">Back</button> \
  <button type="button" class="btn btn-primary" data-dismiss="modal">Start</button> \
  </div>';

  html_str +='</div>';
  html_str += '</div>';
  html_str += '</div>';

document.getElementById("myModal").innerHTML = html_str;

       
}
/* For MTurk mode: show the confirmation message folling the click to the submit button window */
function showSubmitModal() {


   var  html_str = '<div class="modal-dialog modal-sm">';
        html_str += '<div class="modal-content">';
        html_str += '<div class="modal-header">';
        html_str += '<h4 class="modal-title">Confirmation</h4>';
        html_str += '</div>';
        html_str += '<div class="modal-body">';
        //html_str += '<p> Thanks for participating ' + username + '!</p>';


        html_str += '<form id="mtLoginForm" action="/tool.html" method="get">';


        html_str += '<input type="hidden" name="collection" value="slices"/>';
        html_str +=  '<input type="hidden" name="mode" value="mt"/>';

        html_str += '<input type="hidden" id="assignmentId" name="assignmentId"/>';
        html_str += '<input type="hidden" id="number_objects" name="number_objects" value="" />';
        html_str += '<input type="hidden" id="object_name" name="object_name" value="" />';
        html_str += '<input type="hidden" id="LMurl" name="LMurl" value="" />';
        html_str += '<p> Thanks for participating <strong>' + username + '</strong>!</p>';
        html_str += '<button type="submit" class="btn btn-primary">Done</button>';
        html_str += '</form>';

       // html_str += '<button type="button" class="btn btn-primary" data-dismiss="modal">Start</button>';
        html_str +='</div>';
        html_str += '</div>';
        html_str += '</div>';

        /* Make sure we save the SLIC segmentation data */
         if (segmentAnnotator != null) {
          drawing_mode = 2
          main_handler.SubmitQuery();
        }
        document.getElementById("myModal").innerHTML = html_str;
        document.getElementById("myModal").setAttribute("aria-labelledby", "mySmallModalLabel");
        document.getElementById("myModal").setAttribute("aria-hidden", "true");

        $("#myModal").addClass("bs-example-modal-sm");
        $('#myModal').modal({backdrop: 'static', keyboard: false});
        $('#myModal').modal('show');
}

/** Closes the modal window after user reads instructions */
/*function beginMTtask(){



}*/
