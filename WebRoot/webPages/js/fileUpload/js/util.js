/*************************************************
* Source: http://plugins.jquery.com/project/postJSON
* Modifications: 
* a. Replace json to jsonData
* b. Replace success to callbackSuccess
* 
* Function: $.postJSON ( url, jsonObject, success, options )
*    url:           The url to post the json object to
*    jsonObject:    The JSON object to post
*    success:       The success handler to invoke on successful submission
*    options:       Additional options to provide to the AJAX call. This is the exact same object you would use when calling $.ajax directly.
*
* Description:
* $.postJSON simplifies posting JSON objects to any url by invoking $.ajax with the required options. The specified JSON object will be stringified and posted to the url.
* It's up to the server to deserialize the stringified JSON object. ASP.NET MVC 3 will do this automatically
*
* Sample usage:
* var onSuccess = function() { ... };
* var onError = function() { ... };
* $.postJSON ( '/account/login', { username: 'jack', password: 'secretPass' }, onSuccess, { error: onError } );
**************************************************/
(function ($) {
    $.extend({
        postJSON: function (url, jsonData, callbackSuccess, options) {
            var config = {
                url: url,
                type: "POST",
                data: jsonData ? JSON.stringify(jsonData) : null,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: callbackSuccess
            };
            
            // $.ajax($.extend(options, config)); // only works for jQuery 1.4+
            $.ajaxSetup(config); // only works for jQuery 1.5+
            $.ajax();
            
            // reset back so that future users aren't affected
            config = {
                    url: null,
                    type: "GET",
                    data: null,
                    dataType: null,
                    contentType: "application/x-www-form-urlencoded",
                    success: null
                };
            $.ajaxSetup(config);
        }
    });
})(jQuery);