function out= LMdownloadScribbles(varargin)


Narguments = length(varargin);

out = [];

if strcmp(varargin{Narguments}, 'flat')
    flat = 1;
    Narguments = Narguments - 1;
else
    flat = 0; % keep original folder structure
end

if Narguments == 0
    error('Not enough input arguments.') 
end


HOMEIMAGES = varargin{1};
folderlist = urldir(HOMEIMAGES, 'DIR');

if isempty(folderlist)
    return;
end

folderlist = {folderlist(:).name};

if strcmp(folderlist{1}(1),'/'); % remove root folder
    folderlist = folderlist(2:end);
end

% if the first argument was a struct, then we need to change the image
% lists to:
if isstruct(varargin{1})
    clear folders folderlist filelist
    D = varargin{1};
    for i = 1:length(D)
        folders{i} = D(i).annotation.folder;
        filelist{i} = D(i).annotation.filename;
    end
    folderlist = unique(folders);
end

Nfolders = length(folderlist);



% create folders:
if flat == 0
    disp('Create folders');
    for i = 1:Nfolders
        disp(folderlist{i})
        mkdir(HOMEIMAGES, folderlist{i});
    end
else
    disp('Flat mode: all images and annotation will be copied into a single level folder each')
    mkdir(HOMEIMAGES);
    mkdir(HOMEANNOTATIONS);
end


disp('download images...')

scribbles = 1;
% Perform the step recrusively for every-sub folder
for f = 1:Nfolders
    disp(sprintf('Downloading folder %s (%d/%d)...',  folderlist{f}, f, Nfolders)) %#ok<DSPS>
    
    wpi = [HOMEIMAGES  '/' folderlist{f}];
   
     % get .png files
    images = urldir(wpi, 'png');
    if ~isempty(images)
        images = {images(:).name};
    end
    
    Nimages = length(images);
    
    % Download image locally then open in Matlab
    for i = 1:Nimages
	   disp(sprintf(' Downloading image %s (%d/%d)...',  images{i}, i, Nimages)) %#ok<DSPS>
       if flat == 0
            [F,STATUS] = urlwrite([wpi '/' images{i}], fullfile(HOMEIMAGES, folderlist{f}, images{i}));
       else
            [F,STATUS] = urlwrite([wpi '/' images{i}], fullfile(HOMEIMAGES, images{i}));
       end
      
       out{scribbles} = imread(fullfile(HOMEIMAGES,folderlist{f}, images{i})); %#ok<AGROW>
       scribbles = scribbles + 1;

    end
end