% server where the LabelMe data is saved
server = 'http://54.72.79.131';

% User needs to be in directory of LabelMe Matlab
% toolbox for this program to work

% add folder and its subfolders to search path
addpath(genpath('.'));

%HOMEANNOTATIONS = 'http://fypmed.com/Annotations';
%HOMEIMAGES = 'http://fypmed.com/Images';

HOMEANNOTATIONS = strcat(server, '/Annotations');
HOMEIMAGES = strcat(server, '/Images');


% read the XML file and generates a struct array that will
% be used to perform queries and to extract segmentations
% from the images
D = LMdatabase(HOMEANNOTATIONS, {'samples'});

% to access all the polygons of a single image we do

clc;
n = size(D, 2); % number of images

for i=1:n,
    D(i).annotation
end

% number of polygons of the first annotation
poly = size(D(1).annotation.object, 2);

LMdbshowscenes(D, HOMEIMAGES);

boundingbox = LMobjectboundingbox(D(1).annotation, 1);

%LMplot(D, 1, HOMEIMAGES); visualize annotations for one image
%[mask, class] = LMobjectmask(D(1).annotation, HOMEIMAGES);
%figure; imshow(colorSegments(mask)); % show the segmentation masks