var ngHtmlBuilderModule={
    //Collects replace strings from attrs
    collect:function(element,attrs){
        var output={};
        angular.forEach(attrs,function(value,key){
            if (this.regex.test(key)) {
                this.output[key]=value;
                this.element.removeAttr(key);
            }
        },{
            element:element,
            output:output,
            regex:/^\$\w+\$$/i,
        });
        return(output);
    },
    //Merge replace strings in one object
    merge:function(input,output) {
        for (var key in input) 
            if (src.hasOwnProperty(key)) 
                output[key] = input[key];
    },
    //Replace strings
    replace:function(input,replace) {
        var output=new String(input);
        for (var key in replace) 
            if (src.hasOwnProperty(key)) {
                var regex=new RegExp(key,"gi");
                output=output.replace(regex,replace[key]);
            }
        return(output);
    },
    ng_template:"ng-template",
    ng_use:"ng-use",
    ng_clone:"ng-clone",
}
angular.module(
    "ngHtmlBuilder",
    []
    ).directive("ngTemplate",function(){return {
        restrict:"C",
        link:function(scope,element,attrs,controller,transcludeFn){
            element.data(ngHtmlBuilderModule.ng_template,ngHtmlBuilderModule.collect(element,attrs));
        }
    }}).directive("ngUse",function(){return {
        restrict:"EA",
        link:function(scope,element,attrs,controller,transcludeFn){
            element.data(ngHtmlBuilderModule.ng_use,attrs);
        }
    }}).directive("ngClone",function(){return {
        restrict:"EA",
        link:function(scope,element,attrs,controller,transcludeFn){
            var selector="";
            element.data(ngHtmlBuilderModule.ng_clone,ngHtmlBuilderModule.collect(element,attrs));
            if (!angular.isUndefined(attrs[ngHtmlBuilderModule.ng_clone])) try {
                var mark="ng-tmp-"+Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);//Mark current element
                var current=element;//Get current element
                selector=attrs[ngHtmlBuilderModule.ng_clone];//Get selector of template element
                var template=angular.element(document.querySelector(selector)).clone();//Get template element
                var replace={};//Replace 
                ngHtmlBuilderModule.merge(template.data(ngHtmlBuilderModule.ng_template),replace);//Get replace array from template element
                ngHtmlBuilderModule.merge(current.data(ngHtmlBuilderModule.ng_clone),replace);//Get replace array from current element
                template.html(ngHtmlBuilderModule.replace(template.html(),replace));//Replace all strings in template.
                current.addClass(mark);
                var transform=function(template,current,replace){
                    var a=current.data(ngHtmlBuilderModule.ng_use);
                    if (a) if(!angular.isUndefined(a[ngHtmlBuilderModule.ng_use])) try {
                        var found=angular.element(document.querySelector("."+mark+" "+a[ngHtmlBuilderModule.ng_use]));//Find in current element
                        if (found){//If found then use it
                            template.replaceWith(found);
                        } else {//If not found then use children of template elements (default content)
                            template.replaceWith(template.children().clone());
                        }
                        return(false);//Don't go deeper
                    } catch (e){
                        console.error("Unable to find ng-use element (selector: \""+a[ngHtmlBuilderModule.ng_use]+"\")");
                        return(false);//Don't go deeper
                    }
                    return(true);//Go deeper
                };
                var traverse=function(template,current,replace,tool){//Traverse across nested elements
                    if (tool(template,current,replace)){
                        var items=template.children();
                        for(var i=0;i<items.length;i++) traverse(items.eq(i),current,replace);
                    }
                };
                traverse(template,current,replace,transform);
                current.removeClass(mark);
                element.replaceWith(template);//Replace current element with tamplate
            } catch (e){
                console.error("Unable to find ng-template element (selector: \""+selector+"\")");
                element.remove();
            }
        }
    }});