% User needs to be in directory of LabelMe Matlab toolbox for this program to work
% Information on the api can be found at http://labelme.csail.mit.edu/Release3.0/browserTools/php/matlab_toolbox.php

% path of LabelMeToolbox
toolbox_path = '/Users/David/Documents/Imperial/4thYear/fyp/LabelMeToolbox';

% Name of the server hosting the LabelMe annotation tool
server = 'http://54.72.79.131';

cd(toolbox_path);

% add current folder and its subfolders to search path
addpath(genpath('.'));

%HOMEANNOTATIONS = 'http://fypmed.com/Annotations';
%HOMEIMAGES = 'http://fypmed.com/Images';


HOMEANNOTATIONS = strcat(server, '/Annotations');
HOMEIMAGES = strcat(server, '/Images');

% read the XML annotation files from the server and generate a
% struct array that will be used to perform queries and to extract
% segmentation from the images
D = LMdatabase(HOMEANNOTATIONS, {'samples'});

clc;

n = size(D, 2); % number of images

% display information for each annotation
for i=1:n,
    D(i).annotation
end

% number of polygons of the first annotation
poly = size(D(1).annotation.object, 2);

LMplot(D(1), 1, HOMEIMAGES); %visualize annotations for the first image

[mask, class] = LMobjectmask(D(1).annotation, HOMEIMAGES); % extract segments
figure; imshow(colorSegments(mask)); % show the segmentation masks

%LMdbshowscenes(D, HOMEIMAGES);  visualize annotations for all images
% boundingbox = LMobjectboundingbox(D(1).annotation, 1);
