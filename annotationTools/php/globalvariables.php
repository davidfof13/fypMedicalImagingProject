<?php
if (!$public){
   $public = $_GET["public"]; 
}
if (!$username){
   $username = $_COOKIE["username"];
}

$TOOLHOME = "/Users/David/Documents/Imperial/4thYear/fyp/fypMedicalImagingProject/";
$URLHOME = "http://dyn1213-75.wlan.ic.ac.uk//Users/David/Documents/Imperial/4thYear/fyp/fypMedicalImagingProject/";

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
