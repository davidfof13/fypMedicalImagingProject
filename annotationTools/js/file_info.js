/** @file Contains the file_info class, which parses the URL and
 * sets global variables based on the URL.  */

// file_info class - only works for still images at the moment

/**
 * Keeps track of the information for the currently displayed image
 * and fetches the information via dirlists or from the URL.
 * @constructor
*/


function file_info() {
    
    // *******************************************
    // Private variables:
    // *******************************************
    
    this.page_in_use = 0; // Describes if we already see an image.
    this.dir_name = null;
    this.im_name = null;
    this.collection = 'LabelMe';
    this.mode = 'i'; //initialize to picture mode
    this.hitId = null;
    this.assignmentId = null;
    this.workerId = null;
    this.mt_instructions = null;
    
    // *******************************************
    // Public methods:
    // *******************************************
    
    /** Parses the URL and gets the collection, directory, and filename
     * information of the image to be annotated.  Returns true if the
     * URL has collection, directory, and filename information.
    */
    this.ParseURL = function () {
        var labelme_url = document.URL;
        var idx = labelme_url.indexOf('?');
        if((idx != -1) && (this.page_in_use == 0)) {
            this.page_in_use = 1;
            var par_str = labelme_url.substring(idx+1,labelme_url.length);
            var isMT = false; // In MT mode?
            var default_view_ObjList = false;
            do {
                idx = par_str.indexOf('&');
                var par_tag;
                if(idx == -1) par_tag = par_str;
                else par_tag = par_str.substring(0,idx);
                var par_field = this.GetURLField(par_tag);
                var par_value = this.GetURLValue(par_tag);
                if(par_field=='mode'){
                    this.mode = par_value;

                    if(this.mode=='mtn'){

                        if(username != "anonymous")
                            noModal = true;

                        this.mode ='mt';
                        par_value = 'mt';
                    }

                    if(this.mode=='im' || this.mode=='mt') view_ObjList = false;
                    if(this.mode=='mt') isMT = true;
                }
                if(par_field=='username') {
                    username = par_value;
                }
                if(par_field=='collection') {
                    this.collection = par_value;
                }
                if(par_field=='folder') {
                    this.dir_name = par_value;
                }

                if(par_field=='imCount'){
                    MTimCounter = parseInt(par_value) - 1;
                }

                if(par_field=='image') {
                    this.im_name = par_value
                
		            // remove outliers			
		            this.im_name.replace('#', '');
		            this.im_name.replace('/', '');

                    if(this.im_name.indexOf('.jpg')==-1 && this.im_name.indexOf('.png')==-1) {
                        this.im_name = this.im_name + '.jpg';
                    }
                }

                if(par_field=='hitId') {
                    this.hitId = par_value;
                    isMT = true;
                }
                if(par_field=='turkSubmitTo') {
                    isMT = true;
                }
                if(par_field=='assignmentId') {
                    this.assignmentId = par_value;
                    isMT = true;
                }
                if((par_field=='mt_sandbox') && (par_value=='true')) {
                    externalSubmitURL = externalSubmitURLsandbox;
                }
                if(par_field=='N') {
                    mt_N = par_value;
                }
                if(par_field=='workerId') {
                    this.workerId = par_value;
                    isMT = true;
                    
                    // Get second-half of workerId:
                    var len = Math.round(this.workerId.length/2);
                    username = 'MT_' + this.workerId.substring(len-1,this.workerId.length);
                }
                if(par_field=='mt_intro') {
                    MThelpPage = par_value;
                }
                if(par_field=='actions') {
                    // Get allowable actions:
                    var actions = par_value;
                    action_CreatePolygon = 0;
                    action_RenameExistingObjects = 0;
                    action_ModifyControlExistingObjects = 0;
                    action_DeleteExistingObjects = 0;
                    if(actions.indexOf('n')!=-1) action_CreatePolygon = 1;
                    if(actions.indexOf('r')!=-1) action_RenameExistingObjects = 1;
                    if(actions.indexOf('m')!=-1) action_ModifyControlExistingObjects = 1;
                    if(actions.indexOf('d')!=-1) action_DeleteExistingObjects = 1;
                    if(actions.indexOf('a')!=-1) {
                        action_CreatePolygon = 1;
                        action_RenameExistingObjects = 1;
                        action_ModifyControlExistingObjects = 1;
                        action_DeleteExistingObjects = 1;
                    }
                    if(actions.indexOf('v')!=-1) {
                        action_CreatePolygon = 0;
                        action_RenameExistingObjects = 0;
                        action_ModifyControlExistingObjects = 0;
                        action_DeleteExistingObjects = 0;
                    }
                }
                if(par_field=='viewobj') {
                    // Get option for which polygons to see:
                    var viewobj = par_value;
                    view_Existing = 0;
                    view_Deleted = 0;
                    if(viewobj.indexOf('e')!=-1) view_Existing = 1;
                    if(viewobj.indexOf('d')!=-1) view_Deleted = 1;
                    if(viewobj.indexOf('a')!=-1) {
                        view_Deleted = 1;
                        view_Existing = 1;
                    }
                }
                if(par_field=='objlist') {
                    if(par_value=='visible') {
                        view_ObjList = true;
                        default_view_ObjList = true;
                    }
                    if(par_value=='hidden') {
                        view_ObjList = false;
                        default_view_ObjList = false;
                    }
                }
                if(par_field=='mt_instructions') {
                    // One line MT instructions:
                    this.mt_instructions = par_value;
                    this.mt_instructions = this.mt_instructions.replace(/_/g,' ');
                }
                if(par_field=='objects') {
                    // Set drop-down list of object to label:
                    object_choices = par_value.replace('_',' ');
                    object_choices = object_choices.split(/,/);
                }

                if((par_field=='scribble')&&(par_value=='true')) {
		                  scribble_mode = true;
		        }

                if((par_field=='video')&&(par_value=='true')) {
		                  video_mode = true;
		        }

                par_str = par_str.substring(idx+1,par_str.length);

            } while(idx != -1);



            // if there is no file name nor folder name provided, re set url
            if((!this.dir_name) || (!this.im_name)) return this.SetURL(labelme_url);

            // if the username hasn't been set or has been intentionally set to anonymous
            if(username != "anonymous")
                noModal = true;


            
            if(isMT) {


                // activate mTurk display
                document.getElementById('mt_submit_form').style.visibility = 'visible';

                // reposition image canvas
                $(".image_canvas").css({top: '0px', left: '0px'});  

                this.mode='mt'; // Ensure that we are in MT mode
                view_ObjList = default_view_ObjList;

            }
            
            if((this.mode=='i') || (this.mode=='c') || (this.mode=='f')) {
                document.getElementById('body').style.visibility = 'visible';
            }
            else if((this.mode=='im') || (this.mode=='mt')) {

                var p = document.getElementById('header');
                p.parentNode.removeChild(p);

                var p = document.getElementById('tool_buttons');
                p.parentNode.removeChild(p);

                document.getElementById('body').style.visibility = 'visible';

            }
            else {
                this.mode = 'i';
                document.getElementById('body').style.visibility = 'visible';
            }
            
            if(!view_ObjList) {
                var p = document.getElementById('anno_anchor');
                p.parentNode.removeChild(p);
            }
            

            // MTurk Preview Mode: display the general instructions page
            if(this.assignmentId=='ASSIGNMENT_ID_NOT_AVAILABLE') {
                window.location = MThelpPage;
                return false;
            }


            // display the actual hit page
            if(this.mode=='mt') {

                if(!this.mt_instructions) {
                    if(mt_N != 'inf' ) 
                        this.mt_instructions = 'Please label at least ' + mt_N + ' object in this image.';

                    else 
                        this.mt_instructions = 'Please draw a rectangle where the tumour is located';
                }

                if(mt_N=='inf') mt_N = 1;


                var request;
                if (window.XMLHttpRequest) {
                    // IE7+, Firefox, Chrome, Opera, Safari
                    request = new XMLHttpRequest();
                } else {
                    // code for IE6, IE5
                    request = new ActiveXObject('Microsoft.XMLHTTP');
                }
                // load external html file containing user interface
                // this ajax call needs to be synchronous otherwise file may 
                // not get loaded in time
                request.open('GET', 'annotationTools/html/mTurkUI.html', false);
                request.send();



                // append html code
                $('#mt_submit_form').append(request.responseText);
                
                if(global_count >= mt_N) document.getElementById('mt_submit').disabled=false;
                


                // Set dimension of elements in MTUrk interface
                var h = $('.jumbotron').innerHeight();
                var w = $('#hit-container').innerWidth();
                var imH = $('#main_media').innerHeight();
             
                // Set the height of hit-image to 70% that of the jumbotron
                $('#hit-image').height(Math.round(0.7*h));


                $('.hit-menu').css('margin-right', Math.round(0.039*w) + 'px');
                $('#hit-image').css('margin-right', Math.round(0.045*w) + 'px');
                

                $(document).ready(function(){

                    // After loading the MTurk interface
                    // remove next image arrow on the last image
                    if(MTimCounter == 0){
                        $("#arrowCont").remove();
                        $('#mt_submit').click(function(){
                            if (segmentAnnotator != null) main_handler.SubmitQuery();
                        });
                    }
                    
                    if (!noModal){

                        // prevent outside click or esc key from closing modal
                        $('#myModal').modal({
                            backdrop: 'static',
                            keyboard: false
                        });

                        // Prompt user for login if the username is invalid
                        if (username == "anonymous" || username.length == 0){
                          $('#myModal').modal('show');

                          $('#mtLoginForm').on('submit', function () {

                            // get username
                            var login_name = $('#mtLoginForm').serializeArray()[0].value;

                            // get list of usernames of all objects of the current image
                            var names = $(LM_xml).children("annotation").children("object").find("username");

                             // ensure that names are valid first
                            if(login_name.length == 0){
                                    alert("More characters needed!");  
                                    return false; 
                            } else if(!(/\S/.test(login_name))){
                                    alert("No valid characters entered. Please try again");  
                                    return false;
                            } else if(login_name[0] == ' '){
                                    alert("Name can't start with space!");  
                                    return false; 
                            }
                            // go through the list of names
                            for(var i = 0; i < names.length; i++) {
                                if(login_name == names[i].innerHTML){
                                    alert("This name has already been used. Please enter a different one");
                                    return false;

                                }  else if(login_name == "anonymous"){
                                    alert("This name isn't allowed. Please enter a different one");  
                                    return false; 
                                } 
                            }
    
                            username = login_name;
                            showInstructionsModal(login_name);

                            document.getElementById("mtWelcome").innerHTML = '<span class="label label-success">welcome ' + username +  '</span>';
                            return false;
                            
                            });
                        
                        } else{
                            showInstructionsModal(username);
                        }
                        // Note: on the second image of the collection,  the username should already
                        // be set so no need to do it again
                    }


 
                });
                document.getElementById("mtWelcome").innerHTML = '<span class="label label-success">welcome ' + username +  '</span>';

            }
        }
        else {
            return this.SetURL(labelme_url);
        }
        
        return 1;
    };

    
    
    /** Gets mode */
    this.GetMode = function() {
        return this.mode;
    };
    
    /** Gets collection name */
    this.GetCollection = function () {
        return this.collection;
    };
    
    /** Gets directory name */
    this.GetDirName = function () {
        return this.dir_name;
    };
    
    /** Gets image name */
    this.GetImName = function () {
        return this.im_name;
    };
    
    /** Sets image name */
    this.SetImName = function (newImName){
        this.im_name = newImName;
    };
    
    /** Gets image path */
    this.GetImagePath = function () {
        if((this.mode=='i') || (this.mode=='c') || (this.mode=='f') || (this.mode=='im') || (this.mode=='mt')) return 'Images/' + this.dir_name + '/' + this.im_name;
    };
    
    /** Gets annotation path */
    this.GetAnnotationPath = function () {
        if((this.mode=='i') || (this.mode=='c') || (this.mode=='f') || (this.mode=='im') || (this.mode=='mt')) return 'Annotations/' + this.dir_name + '/' + this.im_name.substr(0,this.im_name.length-4) + '.xml';
    };
    
    /** Gets full image name */
    this.GetFullName = function () {
        if((this.mode=='i') || (this.mode=='c') || (this.mode=='f') || (this.mode=='im') || (this.mode=='mt')) return this.dir_name + '/' + this.im_name;
    };
    
    /** Gets template path */
    this.GetTemplatePath = function () {
        if(!this.dir_name) return 'annotationCache/XMLTemplates/labelme.xml';
        return 'annotationCache/XMLTemplates/' + this.dir_name + '.xml';
    };
    
    // *******************************************
    // Private methods:
    // *******************************************
    
    /** String is assumed to have field=value form.  Parses string to
    return the field. */
    this.GetURLField = function (str) {
        var idx = str.indexOf('=');
        return str.substring(0,idx);
    };
    
    /** String is assumed to have field=value form.  Parses string to
     return the value. */
    this.GetURLValue = function (str) {
        var idx = str.indexOf('=');
        return str.substring(idx+1,str.length);
    };
    
    /** Changes current URL to include collection, directory, and image
    name information.  Returns false. */
    this.SetURL = function (url) {



        this.FetchImage();

	   // Get base LabelMe URL:
        var idx = url.indexOf('?');
        if(idx != -1) {
            url = url.substring(0,idx);
        }
        
        // Include username in URL:
        var extra_field = '';
        if(username != 'anonymous') extra_field = '&username=' + username;
        
        if(this.mode=='i') window.location = url + '?collection=' + this.collection + '&mode=' + this.mode + '&folder=' + this.dir_name + '&image=' + this.im_name + extra_field;
        else if(this.mode=='im') window.location = url + '?collection=' + this.collection + '&mode=' + this.mode + '&folder=' + this.dir_name + '&image=' + this.im_name + extra_field;
        else if(this.mode=='mt') window.location = url + '?collection=' + this.collection + '&mode=mtn&folder=' + this.dir_name + '&image=' + this.im_name + '&imCount=' + MTimCounter  + extra_field;
        else if(this.mode=='c') window.location = url + '?mode=' + this.mode + '&username=' + username + '&collection=' + this.collection + '&folder=' + this.dir_name + '£' + this.im_name + extra_field;
        else if(this.mode=='f') window.location = url + '?mode=' + this.mode + '&folder=' + this.dir_name + '&image=' + this.im_name + extra_field;
        return false;
    };
    
    /** Fetch next image. */
    this.FetchImage = function () {
        var url = 'annotationTools/perl/fetch_image.cgi?mode=' + this.mode + '&username=' + username + '&collection=' + this.collection.toLowerCase() + '&folder=' + this.dir_name + '&image=' + this.im_name;
        var im_req;
        // branch for native XMLHttpRequest object
        if (window.XMLHttpRequest) {
            im_req = new XMLHttpRequest();
            im_req.open("GET", url, false);
            im_req.send('');
        }
        else if (window.ActiveXObject) {
            im_req = new ActiveXObject("Microsoft.XMLHTTP");
            if (im_req) {
                im_req.open("GET", url, false);
                im_req.send('');
            }
        }

        if(im_req.status==200) {

            this.dir_name = im_req.responseXML.getElementsByTagName("dir")[0].firstChild.nodeValue;
            this.im_name = im_req.responseXML.getElementsByTagName("file")[0].firstChild.nodeValue;
        }
        else {
            alert('Fatal: there are problems with fetch_image.cgi');
        }
    };


}
