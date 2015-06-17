% User needs to be in directory of LabelMe Matlab toolbox for this program to work
% Information on the api can be found at http://labelme.csail.mit.edu/Release3.0/browserTools/php/matlab_toolbox.php

% path of LabelMeToolbox
%toolbox_path = '/Users/David/Documents/Imperial/4thYear/fyp/LabelMeToolbox';

% Name of the server hosting the LabelMe annotation tool
server = 'http://54.72.79.131';
%server = 'http://fypmed.com';

%cd('matlabToolbox');

% add current folder and its subfolders to search path
addpath(genpath('matlabToolbox'));

addpath(genpath('matlabJson'));

%HOMEANNOTATIONS = 'http://fypmed.com/Annotations';
%HOMEIMAGES = 'http://fypmed.com/Images';

HOMEANNOTATIONS = strcat(server, '/Annotations');
HOMEIMAGES = strcat(server, '/Images');
HOMESCRIBBLES = strcat(server, '/Scribbles');


collection = '4Dslices';

% startup json to decode json strings
json.startup;

% read the XML annotation files from the server and generate a
% struct array that will be used to perform queries and to extract
% segmentation from the images
%D = LMdatabase(HOMEANNOTATIONS, {'samples'});
A = LMdatabase(strcat(HOMEANNOTATIONS, '/', collection));
clc;
S = LMdownloadScribbles(strcat(HOMESCRIBBLES, '/', collection));

clc;

n = size(A, 2); % number of images

% number of polygons of the first annotation
poly = size(A(1).annotation.object, 2);

%LMplot(D(1), 1, HOMEIMAGES); %visualize annotations for the first image

%[mask, class] = LMobjectmask(D(1).annotation, HOMEIMAGES); % extract segments
%figure; imshow(colorSegments(mask)); % show the segmentation masks

%LMdbshowscenes(D, HOMEIMAGES);  visualize annotations for all images
% boundingbox = LMobjectboundingbox(D(1).annotation, 1);

rect = [];
scribbles = [];
slic = [];

r = 1;
k = 1;
p = 1;

tot = 0;
for i=1:n,
    
    % get current annotation file
    anno = A(i).annotation;
    objects = anno.object;
    
    tot = tot + length(objects);
    
    for j=1:length(objects)
        object = objects(j);
        

        if isfield(object, 'polygon') && ~isempty(object.polygon)
            
            % it's a segmentation
            if isfield(object, 'segm') && ~isempty(object.segm)
                scribbles{k}.data = S{k};
                
                % convert to 2D
                x = scribbles{k}.data;
                scribbles{k}.data = x(:,:,1);
                
                scribbles{k}.data = imresize(scribbles{k}.data, 512/size(scribbles{k}.data,1));
                
                scribbles{k}.filename = anno.filename;
                scribbles{k}.fileinfo = anno.scenedescription;
                k = k + 1;
            
            
            else % it's a polygon
                anno.object =  object;
                [mask, class] = LMobjectmask(anno, HOMEIMAGES);
                rect{r}.data = mask;
                rect{r}.filename = anno.filename;
                rect{r}.fileinfo = anno.scenedescription;
                r = r + 1;
            end
        elseif isfield(object, 'slicsegm') && ~isempty(object.slicsegm)
                    
                slic{p}.data = object.slicsegm;
                            
                if (isstruct(slic{p}.data))
                    slic_str = json.load(slic{p}.data.data);
                  
                    png_data = base64decode(strrep(slic_str.annotation, 'data:image/png;base64', ''));
                    segmentation_map = imdecode(png_data, 'png');
                    slic{p}.data = segmentation_map;
                end
                
                 % convert to 2D
                x = slic{p}.data;
                slic{p}.data = x(:,:,1);
                
                % resize
                slic{p}.data = imresize(slic{p}.data , 512/size(slic{p}.data,1) );
                
                slic{p}.filename = anno.filename;
                slic{p}.fileinfo = anno.scenedescription;
                p = p + 1;
                
        end
    end
    
end

% save to .mat
save('annotations.mat', 'rect', 'scribbles', 'slic');
    