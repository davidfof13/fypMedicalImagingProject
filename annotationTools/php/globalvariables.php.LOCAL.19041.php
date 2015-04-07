<?php
if (!$public){
   $public = $_GET["public"]; 
}
if (!$username){
   $username = $_COOKIE["username"];
}

$TOOLHOME = "/home/ubuntu/fypMedicalImaging/";
$URLHOME = "http://ip-172-31-3-77.eu-west-1.compute.internal//home/ubuntu/fypMedicalImaging/";

if (!$public==true) {
   $HOMEIMAGES = $TOOLHOME."Images/users/$username/";
   $HOMEANNOTATIONS = $TOOLHOME."Annotations/users/$username/"; 
   $HOMETHUMBNAILS = $TOOLHOME."Thumbnails/users/$username/"; 
   $HOMEDOWNLOADS = $TOOLHOME."Downloads/users/$username/"; 
   $HOMEMASKS = $TOOLHOME."Masks/users/$username/"; 
   $HOMESCRIBBLES = $TOOLHOME."Scribbles/users/$username/"; 

   // LabelMe annotation tool link
   $LABELMEtool = $URLHOME."tool.html?collection=LabelMe&mode=f&folder=users/$username/";

   // Address to image thumbnails
   $URLTHUMBNAILS = $URLHOME."Thumbnails/users/$username/";
   $URLDOWNLOADS = $URLHOME."Downloads/users/$username/";
}
else {
   $HOMEIMAGES = $TOOLHOME."Images/";
   $HOMEANNOTATIONS = $TOOLHOME."Annotations/"; 
   $HOMETHUMBNAILS = $TOOLHOME."Thumbnails/"; 
   $HOMEDOWNLOADS = $TOOLHOME."Downloads/"; 
   $HOMEMASKS = $TOOLHOME."Masks/"; 
   $HOMESCRIBBLES = $TOOLHOME."Scribbles/";
   // LabelMe annotation tool link
   $LABELMEtool = $URLHOME."tool.html?collection=LabelMe&mode=f&folder=";

   // Address to image thumbnails
   $URLTHUMBNAILS = $URLHOME."Thumbnails/";
   $URLDOWNLOADS = $URLHOME."Downloads/";
}
