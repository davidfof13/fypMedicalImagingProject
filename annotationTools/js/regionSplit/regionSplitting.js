      // Create a legend.
      function initializeLegend(annotator) {


        // Attach a click event to a legend item.
        function attachClickEvent(item, i) {

          item.addEventListener('click', function() {
            annotator.setCurrentLabel(i);
          });
        }

        var labels = annotator.getLabels();

        // fetch <a> elements of label buttons
        var items = $('#regionDropdown').parent().find('.hit-submenu').find('a');


        for (var i = 0; i < labels.length; ++i) {
          // Create an item.
          var color = labels[i].color;         
          // The event should be attached to our button instead
          attachClickEvent(items[i], i);

        }

        var currentIndex = Math.min(1, labels.length - 1);
        items[currentIndex].click();
      }


      /* returns JSON representation of SLIC segmentation */
      function exportSLICdata(){

          var data = {
            labels:  segmentAnnotator.getLabels(),
            annotation: segmentAnnotator.getAnnotation()
          };
          return JSON.stringify(data);
        
      }


      /* Show the orginal SLIC segmented image, Disables any effects that is 
         active
       */
      function originalView(){

        if(segmentAnnotator.colorMaskEnabled)
          colorMaskView();

        if(segmentAnnotator.boundaryEnabled)
          boundaryView();

      }

      function boundaryView(){

        if(segmentAnnotator == null) return;

        // make sure to disable any other views first
        if(segmentAnnotator.colorMaskEnabled)
          colorMaskView();

        if(segmentAnnotator.boundaryEnabled)
          segmentAnnotator.setBoundaryAlpha(192); // deactivate

        else
          segmentAnnotator.setBoundaryAlpha(128); // activate

         segmentAnnotator.boundaryEnabled = !segmentAnnotator.boundaryEnabled;
      }


      function colorMaskView(){

        if(segmentAnnotator == null) return;

        // make sure to disable any other views first
        if(segmentAnnotator.boundaryEnabled)
          boundaryView();

        if(segmentAnnotator.colorMaskEnabled)
          segmentAnnotator.setImageAlpha(255);
        

        else
           segmentAnnotator.setImageAlpha(0);
        
          segmentAnnotator.colorMaskEnabled = !segmentAnnotator.colorMaskEnabled;
      }

      function updateRegionSize(){

          /* region size */
          var val = parseInt(document.getElementById('regionsRange').amount.value);

          segmentAnnotator = null;
          segmentAnnotator =  new SLICSegmentAnnotator(main_media.file_info.GetImagePath(), {
                regionSize: val,
                container: document.getElementById('regionDiv'),
                // annotation: 'annotation.png' // optional existing annotation data.
                labels: [{name: 'background', color: [255, 255, 255]},'object'],
                onload: function() {initializeLegend(this);}
          });

          $('#regionsResolution').popover('hide');

      }
