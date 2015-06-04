#!/bin/bash

FOLDER="4Dslices/"
#FOLDER="samples"
MASKS="Masks/";
SCRIBBLES="Scribbles/";
ANNOTATIONS="Annotations/";

#sudo rm -rf Masks/samples/ && sudo rm -rf Scribbles/samples && sudo rm -rf Annotations/samples/ && sudo rm -rf annotationCache/TmpAnnotations/*
sudo rm -rf $MASKS$FOLDER && sudo rm -rf $SCRIBBLES$FOLDER && sudo rm -rf $ANNOTATIONS$FOLDER && sudo rm -rf annotationCache/TmpAnnotations/*
