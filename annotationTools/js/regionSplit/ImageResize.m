%re-size the image such that it's biggest dimension (horizontally or vertically) is 600

imPath = '/Users/David/Documents/Imperial/4thYear/fyp/fypMedicalImagingProject/js-segment-annotator/images/car.jpg'; % input image path
im = imread(imPath);% read input image
%im = rgb2gray(im); % gray image


% get the scale factor
h = size(im,1);
w= size(im,2);

scale = max(h, w)/600;


out = strcat('/Users/David/Documents/Imperial/4thYear/fyp/fypMedicalImagingProject/js-segment-annotator/out.jpg'); % input image

if h >= w,
    I = imresize(im, [600 round(w/scale)]);
    
else
    I = imresize(im, [round(h/scale) 600]);
    
end;
    
imwrite(I, out, 'JPG');



