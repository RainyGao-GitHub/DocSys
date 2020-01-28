function showPdf() {
    //<script src="static/pdfjs/build/pdf.js"></script>
    //<script src="static/pdfjs/build/pdf.worker.js"></script>

            var container = document.getElementById("the-canvas");
            container.style.display = "block";
            //var url = 'http://127.0.0.1:8080/java.pdf';
            var url = "http://localhost:8080/DocSystem/Doc/downloadDoc.do?targetPath=" + "QzovRG9jU3lzUmVwb3Nlcy8xNC9kYXRhL3JkYXRhLw" + "&targetName=" + "44CK6Leo6YOo6Zeo5rKf6YCa5oqA5ben44CL5a2m5ZGY5omL5YaMICgxKS5wZGY";
            if(gShareId)
            {
            	url += "&shareId=" + gShareId;
            }
 
            pdfjsLib.workerSrc = "static/pdfjs/build/pdf.worker.js";
            pdfjsLib.getDocument(url).then(function getPdfHelloWorld(pdf) {
            	var $pop = $('#pop');
                var shownPageCount = pdf.numPages < 50 ? pdf.numPages : 50;//设置显示的编码
                var getPageAndRender = function (pageNumber) {
                	 pdf.getPage(pageNumber).then(function getPageHelloWorld(page) {
                         var scale = 1.2;
                         var viewport = page.getViewport(scale);
                         var $canvas = $('<canvas></canvas>').attr({
                             'height': viewport.height,
                             'width': viewport.width,
                         });
                         $pop.append($canvas);
                         
                         page.render({
                             canvasContext: $canvas[0].getContext('2d'),
                             viewport: viewport
                         });
                     });
                	 if (pageNumber < shownPageCount) {
                         pageNumber++;
                         getPageAndRender(pageNumber);
                     }  
                };
                getPageAndRender(1);        		   
            });
            
        }