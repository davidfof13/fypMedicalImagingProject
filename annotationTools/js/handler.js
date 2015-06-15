/** @file This contains the high-level commands for transitioning between the different annotation tool states.  They are: REST, DRAW, SELECTED, QUERY.
*/

// Handles all of the user's actions and delegates tasks to other classes.
// Also keeps track of global information.
var REST_CANVAS = 1;
var DRAW_CANVAS = 2;
var SELECTED_CANVAS = 3;
var QUERY_CANVAS = 4;

// Global variable indicating which canvas is active:
var active_canvas = REST_CANVAS;

function handler() {
    
    // *******************************************
    // Public methods:
    // *******************************************
    
    // Handles when the user presses the delete button in response to
    // the "What is this object?" popup bubble.
    this.WhatIsThisObjectDeleteButton = function () {
      submission_edited = 0;
      this.QueryToRest();
    };
    
    // Submits the object label in response to the edit/delete popup bubble.
    this.SubmitEditLabel = function () {
      submission_edited = 1;
      var anno = select_anno;
      
      // object name
      old_name = LMgetObjectField(LM_xml,anno.anno_id,'name');
      if(document.getElementById('objEnter')) new_name = RemoveSpecialChars(document.getElementById('objEnter').value);
      else new_name = RemoveSpecialChars(adjust_objEnter);
      
      var re = /[a-zA-Z0-9]/;
      if(!re.test(new_name)) {
	       alert('Please enter an object name');
	       return;
      }
      
      if (use_attributes) {
	      // occlusion field
	      if (document.getElementById('occluded')) new_occluded = RemoveSpecialChars(document.getElementById('occluded').value);
	      else new_occluded = RemoveSpecialChars(adjust_occluded);
	
	      // attributes field
	      if(document.getElementById('attributes')) new_attributes = RemoveSpecialChars(document.getElementById('attributes').value);
	      else new_attributes = RemoveSpecialChars(adjust_attributes);
      }
      
      StopEditEvent();
      
      // Insert data to write to logfile:
      if(editedControlPoints) InsertServerLogData('cpts_modified');
      else InsertServerLogData('cpts_not_modified');
      
      // Object index:
      var obj_ndx = anno.anno_id;
      
      // Pointer to object:
      
      // Set fields:
      LMsetObjectField(LM_xml, obj_ndx, "name", new_name);
      LMsetObjectField(LM_xml, obj_ndx, "automatic", "0");
      
      // Insert attributes (and create field if it is not there):
      LMsetObjectField(LM_xml, obj_ndx, "attributes", new_attributes);
        

      
      LMsetObjectField(LM_xml, obj_ndx, "occluded", new_occluded);

      
      // Write XML to server:
      WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
      
      // Refresh object list:
      if(view_ObjList) {
	       RenderObjectList();
	       ChangeLinkColorFG(anno.GetAnnoID());
      }
    };
    
    // Handles when the user presses the delete button in response to
    // the edit popup bubble.
    this.EditBubbleDeleteButton = function () {
        var idx = select_anno.GetAnnoID();

        if((IsUserAnonymous() || (!IsCreator(LMgetObjectField(LM_xml, idx, 'username')))) && (!IsUserAdmin()) && (idx<num_orig_anno) && !action_DeleteExistingObjects) {
            alert('You do not have permission to delete this polygon');
            return;
        }
        
        if(idx>=num_orig_anno) {
            global_count--;
        }
        
        submission_edited = 0;
        
        // Insert data for server logfile:
        old_name = LMgetObjectField(LM_xml,select_anno.anno_id,'name');
        new_name = old_name;
        WriteLogMsg('*Deleting_object');
        InsertServerLogData('cpts_not_modified');
        
        // Set <deleted> in LM_xml:
        LMsetObjectField(LM_xml, idx, "deleted", "1");
        
        // Remove all the part dependencies for the deleted object
        removeAllParts(idx);
        
        // Write XML to server:
        WriteXML(SubmitXmlUrl,LM_xml,function(){return;});

	       // Refresh object list:
        if(view_ObjList) RenderObjectList();
        selected_poly = -1;
        unselectObjects(); // Perhaps this should go elsewhere...
        StopEditEvent();
    };
    
    // Handles when the user clicks on the link for an annotation.
    this.AnnotationLinkClick = function (idx) {
      if (video_mode && LMgetObjectField(LM_xml, idx, 'x', oVP.getcurrentFrame()) == null){
        // get frame that is closest
        var frames = LMgetObjectField(LM_xml, idx, 't');
        var id1 = -1;
        var id2 = frames.length;
        var i = 0;
        while (i < frames.length){
          if (frames[i] >= oVP.getcurrentFrame()) id2 = Math.min(id2, i);
          else id1 = Math.max(id1, i);
          i++;
        }
        if (id2 < frames.length) oVP.GoToFrame(frames[id2]);
        else oVP.GoToFrame(frames[id1]);

      }
      if(active_canvas==REST_CANVAS) StartEditEvent(idx,null);
      else if(active_canvas==SELECTED_CANVAS) {

      	var anno_id = select_anno.GetAnnoID();
      	if(edit_popup_open && (idx==anno_id)) StopEditEvent();

      }
    };
    
    // Handles when the user moves the mouse over an annotation link.
    this.AnnotationLinkMouseOver = function (a) {
        if (video_mode && LMgetObjectField(LM_xml, a, 'x', oVP.getcurrentFrame()) == null){
          ChangeLinkColorFG(a);
          selected_poly = a;
          oVP.HighLightFrames(LMgetObjectField(LM_xml, a, 't'));
        } 
        else if(active_canvas!=SELECTED_CANVAS) selectObject(a);
    };
    
    // Handles when the user moves the mouse away from an annotation link.
    this.AnnotationLinkMouseOut = function () {
       
      if(active_canvas!=SELECTED_CANVAS) unselectObjects();
      if (video_mode){
        oVP.UnHighLightFrames();
      }
    };
    
    // Handles when the user moves the mouse over a polygon on the drawing
    // canvas.
    this.CanvasMouseMove = function (event,pp) {
        var x = GetEventPosX(event);
        var y = GetEventPosY(event);
        //if(IsNearPolygon(x,y,pp)) selectObject(pp);
        selectObject(pp);
        //else unselectObjects();
    };
    
    // Submits the object label in response to the "What is this object?"
    // popup bubble. THIS FUNCTION IS A MESS!!!!
    this.SubmitQuery = function () {
      var nn;
      var anno;

      var lmode = main_media.GetFileInfo().GetMode();

      // If the attributes are active, read the fields.
      if (use_attributes) {
       // get attributes (is the field exists)
       if(document.getElementById('attributes')) new_attributes = RemoveSpecialChars(document.getElementById('attributes').value);
       else new_attributes = "";
  
       // get occlusion field (is the field exists)
       if (document.getElementById('occluded')) new_occluded = RemoveSpecialChars(document.getElementById('occluded').value);
       else new_occluded = "";
      }

      if((object_choices!='...') && (object_choices.length==1)) {
         nn = RemoveSpecialChars(object_choices[0]);

         active_canvas = REST_CANVAS;
  
         // Move draw canvas to the back:
         document.getElementById('draw_canvas').style.zIndex = -2;
         document.getElementById('draw_canvas_div').style.zIndex = -2;
  
         // Remove polygon from the draw canvas:
         var anno = null;
         if(draw_anno) {
           draw_anno.DeletePolygon();
           anno = draw_anno;
           draw_anno = null;
         }
      }  else {

	       if(lmode != "mt")
           	nn = RemoveSpecialChars(document.getElementById('objEnter').value);

            anno = this.QueryToRest();
      }


	   if(lmode == "mt"){
         
	      	nn = "anno_" + $(LM_xml).children('annotation').children('object').length; 

	    }

      var re = /[a-zA-Z0-9]/;

      if(!re.test(nn)) {
         alert('Please enter an object name');
         return;
      }

       // Update old and new object names for logfile:
      new_name = nn;
      old_name = nn;
      
      submission_edited = 0;
      global_count++;
      
      // Insert data for server logfile:
      InsertServerLogData('cpts_not_modified');
      
      // Insert data into XML:
      var html_str = '<object>';
      html_str += '<name>' + new_name + '</name>';
      html_str += '<deleted>0</deleted>';
      html_str += '<verified>0</verified>';
      
      if(use_attributes) {
         html_str += '<occluded>' + new_occluded + '</occluded>';
         html_str += '<attributes>' + new_attributes + '</attributes>';
      }

      html_str += '<parts><hasparts></hasparts><ispartof></ispartof></parts>';
      var ts = GetTimeStamp();
      if(ts.length==20) html_str += '<date>' + ts + '</date>';
      html_str += '<id>' + anno.anno_id + '</id>';

      if (bounding_box){
          html_str += '<type>'
          html_str += 'bounding_box';
          html_str += '</type>'
      } 


      if(anno.GetType() == 1) {
        
      
        /*************************************************************/
        /*************************************************************/
        // Scribble: Add annotation to LM_xml:
        html_str += '<segm>';
        html_str += '<username>' + username + '</username>';
  
        html_str += '<box>';
        html_str += '<xmin>' + scribble_canvas.object_corners[0] + '</xmin>'; 
        html_str += '<ymin>' + scribble_canvas.object_corners[1] + '</ymin>';
        html_str += '<xmax>' + scribble_canvas.object_corners[2] + '</xmax>'; 
        html_str += '<ymax>' + scribble_canvas.object_corners[3] + '</ymax>';
        html_str += '</box>';
  
        html_str += '<mask>'+ scribble_canvas.image_name +'</mask>';
  
        html_str += '<scribbles>';
        html_str += '<xmin>' + scribble_canvas.image_corners[0] + '</xmin>'; 
        html_str += '<ymin>' + scribble_canvas.image_corners[1] + '</ymin>';
        html_str += '<xmax>' + scribble_canvas.image_corners[2] + '</xmax>'; 
        html_str += '<ymax>' + scribble_canvas.image_corners[3] + '</ymax>';
        html_str += '<scribble_name>'+ scribble_canvas.scribble_name +'</scribble_name>'; 
        html_str += '</scribbles>';
  
        html_str += '</segm>';
        html_str += '</object>';
        $(LM_xml).children("annotation").append($(html_str));

        if(lmode == "mt"){
          // Disable segmentation preview button
          $('#segmA').removeClass('active');
          $('#segmA').parent().removeClass('active');
        }

        /*************************************************************/
        /*************************************************************/
      }   

      else if (anno.GetType() == 2){

            //third annotation
            html_str += '<slicsegm>';
            html_str += '<username>' + username + '</username>';
            html_str += '<data>' + exportSLICdata() + '</data>';
            html_str += '</slicsegm>';
            html_str += '</object>';
            $(LM_xml).children("annotation").append($(html_str));
      }


      else  {
         html_str += '<polygon>';
         html_str += '<username>' + username + '</username>';
        
         for(var jj=0; jj < draw_x.length; jj++) {
           html_str += '<pt>';
           html_str += '<x>' + draw_x[jj] + '</x>';
           html_str += '<y>' + draw_y[jj] + '</y>';
           html_str += '</pt>';
         }

        html_str += '</polygon>';
        html_str += '</object>';
        $(LM_xml).children("annotation").append($(html_str));
    }      
      

      
      if(anno.GetType() != 2){
        if(!LMgetObjectField(LM_xml, LMnumberOfObjects(LM_xml)-1, 'deleted') ||view_Deleted) {
          main_canvas.AttachAnnotation(anno);
          anno.RenderAnnotation('rest');
        }
      }
      
      /*************************************************************/
      /*************************************************************/
      // Scribble: Clean scribbles.
      if(anno.GetType() == 1) {

        scribble_canvas.cleanscribbles();
        scribble_canvas.scribble_image = "";
        scribble_canvas.colorseg = Math.floor(Math.random()*14);

      }
      /*************************************************************/
      /*************************************************************/

      // Write XML to server:
      WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
      
      if(view_ObjList) RenderObjectList();
      
      var m = main_media.GetFileInfo().GetMode();
      if(m=='mt') {

       // document.getElementById('object_name').value=new_name;
       // document.getElementById('number_objects').value=global_count;
       // document.getElementById('LMurl').value = LMbaseurl + '?collection=LabelMe&mode=i&folder=' + main_media.GetFileInfo().GetDirName() + '&image=' + main_media.GetFileInfo().GetImName();
        if(global_count >= mt_N && (MTimCounter == 0)) document.getElementById('mt_submit').disabled=false;

      }

    };
    
      // Handles when we wish to change from "query" to "rest".
      this.QueryToRest = function () {

        var anno;
        if(drawing_mode == 2){ // for the region selection mode
            anno = new annotation(LMnumberOfObjects(LM_xml));
            anno.SetType(2);
            return anno;
        }
           
       active_canvas = REST_CANVAS;

       // Move query canvas to the back:
	     document.getElementById('query_canvas').style.zIndex = -2;
	     document.getElementById('query_canvas_div').style.zIndex = -2;


	     // Remove polygon from the query canvas:
	     if(query_anno) query_anno.DeletePolygon();
	    
       anno = query_anno;
	     query_anno = null;
  
	     CloseQueryPopup();
	     main_media.ScrollbarsOn();

       return anno;
    };
    
    // Handles when the user presses a key while interacting with the tool.
    this.KeyPress = function (event) {
        // Delete event: 46 - delete key; 8 - backspace key
        if(((event.keyCode==46) || (event.keyCode==8)) && !wait_for_input && !edit_popup_open && !username_flag) {
            // Determine whether we are deleting a complete or partially
            // complete polygon.
            if(!main_handler.EraseSegment()) DeleteSelectedPolygon();
        }
        // 27 - Esc key
        // Close edit popup if it is open.
        if(event.keyCode==27 && edit_popup_open) StopEditEvent();
    };
    
    // Handles when the user erases a segment.
    this.EraseSegment = function () {
        if(draw_anno && !draw_anno.DeleteLastControlPoint()) {
            submission_edited = 0;
            StopDrawEvent();
        }
        return draw_anno;
    };
    

    // handles when the user clicks on a dropdown menu of the 
    // hit menu of the MTurk user interface
    this.setHITMenu = function () {  


        
        // set current list element to active
        $('.menu-ul>li>a').click(function(){


            // user needs to click preview button befor moving to next task
            if(this.id != "scribbleDropdown" && $('#segmA').hasClass('active'))
                    return;

            if(this.id == "regionDropdown" && segmentAnnotator == null)
              return; 

            if(this.id == "segmA")
                return;

            var el = $('.menu-ul').find('.active');

            el.removeClass('active');
            this.className += ' active';

            // If we just clicked on the dropdown menu
            // display segment button
            if(this.id == "scribbleDropdown"){
              document.getElementById('segmButton').style.display = 'block';

              // if scribbles have already been drawn, light up the segment button
              if(scribble_canvas.clickX.length > 0) {

                $("#segmA").addClass('active');
                $("#segmbutton").addClass('active');
              }
            }

            // if we click on any other button except the drop down menu,
            // while the dropdown menu is opened, close dropdown menu and
            // hide segment button
            if (el.parent().hasClass("dropdown") && el.attr("id") != this.id
                && $('.caret').length){

              el.parent().find('.hit-submenu').slideToggle();
              el.parent().find('.caret').attr('class', 'caret-right');

              if(el.attr("id") == "scribbleDropdown")
                document.getElementById('segmButton').style.display = 'none';
            }


        });


         // Submenu commands: set current sublist element to active
        $('.hit-submenu>li>a:not(#segmA)').click(function(){
         

         $('.hit-submenu').find(".active").removeClass('active');
         this.className += ' active';

         // also set it to the li encompassing it
         //this.parentNode.style.backgroundColor = cl;
         this.parentNode.className += ' active';

        });


        // Dropdown menus slide action
        $('.dropdown>a').click(function(){
          
          // user needs to click preview button befor moving to next task
            if($('#segmA').hasClass('active'))
                    return;

          var parent = $("#" + this.id).parent();

          // cancel sliding if the tool hasn't been initialized
          if(this.id == "regionDropdown" && segmentAnnotator == null)
              return;


          parent.find(".hit-submenu").slideToggle();


          // slide up
          if (parent.find(".caret").length){

              parent.find(".caret").attr('class', 'caret-right');

              if(this.id == "scribbleDropdown")
                document.getElementById('segmButton').style.display = 'none';
          }

          // slide down
          else{

                // set default command
               if(this.id == "scribbleDropdown"){
                $('#foreground').addClass('active');
                $('#foreground').parent().addClass('active');

               }  else{

                  var el = $('#regionDropdown').parent().find('.hit-submenu>li>a');
                  el[0].className += " active";
                  el[0].parentNode.className += " active";
                }
               

               // caret right
               parent.find(".caret-right").attr('class', 'caret');
          }

        });
    };

    /* Creates popover that queries the user to skip the next image
     or continue working on the current image
     */
    this.MTaddPopover = function(id){
      var contentHtml;
      var title;

      contentHtml = '<div>';

      if(id == "#main_media"){
        title = "annotation";
        contentHtml += '<p style="font-size: 150%;">No one has labelled this image. There\'s probably nothing relevant to annotate \
                     in it. Do you want to skip it?</p>';
        contentHtml += '</div>';

        contentHtml += '<div style="display:inline-flex;">';
        contentHtml += '<button class="btn btn-danger cancel" style="margin-right:4px;">Cancel</button>';

        if(MTimCounter == 0)  contentHtml += '<button class="btn btn-success save" onmousedown="showSubmitModal();">Done</button>';
        else contentHtml += '<button class="btn btn-primary save" onmousedown="javascript:MTNextImage();">Skip</button>';

      } else if(id == "#regionsResolution"){


        title = "region size";
        contentHtml += '<form id="regionsRange" style="margin-bottom:30px;"> ';
        contentHtml += '<input type="range" id="rangeInput" name="amountRange" min="' + MIN_REGION_SIZE + '" max="' + MAX_REGION_SIZE;
        contentHtml +=  '" value="' + MIN_REGION_SIZE  +'" style="float:left; margin-right:10%; width:80%;" \
        oninput="this.form.amount.value=this.value" />';
    
        contentHtml += '<output name="amount" for="rangeInput" style="padding-top:12px;">' + MIN_REGION_SIZE + '</output>';
        contentHtml += '</form>';


        contentHtml += '<button class="btn btn-danger cancel" style="margin-left:5%; margin-right:4px;">Cancel</button>';
        contentHtml += '<button class="btn btn-success save" onmousedown="updateRegionSize();">Done</button>';
      }
      contentHtml += '</div>';

      $(id).popover({
        title: title,
        placement: 'right',
        container: 'body',
        html: true,
        content : contentHtml,
        trigger: 'manual'
      }).on('shown.bs.popover', function () {

        var $popup = $(this);
        $('.popover').find('button.cancel').click(function (e) {$popup.popover('hide');});

          if( $(this).attr("id") == "main_media"){
            $('.popover').find('button.save').click(function (e) { $popup.popover('hide');});
          }
      });

      if (  ((LMnumberOfObjects(LM_xml) == 0)  && id=="#main_media")  || id != "#main_media"){
          $(id).popover('show');
      }
    };

    /* toggles visibility property of annotations
    */
    this.MTshowORhideAnnotations = function(){
      var anno = $("#myCanvas_bg").children();

      for(var i =0; i < anno.length; i++){

        if(anno[i].style.visibility != "hidden")
          anno[i].style.visibility = "hidden";

        else
          anno[i].style.visibility = "visible";
      }
    }



    
}
