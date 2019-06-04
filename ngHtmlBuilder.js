var ngHtmlBuilderModule={
    //Source: https://github.com/angular/angular.js/blob/v1.3.10/src/Angular.js#L1447-L1453
    snake_case:function(name){
      return name.replace(/[A-Z]/g,function(letter,pos){
        return (pos?'-':'')+letter.toLowerCase();
      });
    },
    //Gets random string
    randomString:function(){
        return(Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15));
    },
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
            if (input.hasOwnProperty(key)) 
                output[key] = input[key];
    },
    //Replace strings
    replace:function(input,replace) {
        var output=new String(input);
        for (var key in replace) 
            if (replace.hasOwnProperty(key)) {
                var regex=new RegExp(key.replace(/\$/g,"\\$"),"gi");
                output=output.replace(regex,replace[key]);
            }
        return(output);
    },
    ngTemplate:"ngTemplate",
    ngUse:"ngUse",
    ngClone:"ngClone",
    ngSelector:"ngSelector",
}
angular.module(
    "ngHtmlBuilder",
    []
    ).directive(ngHtmlBuilderModule.ngTemplate,function(){return {
        restrict:"C",
        link:function(scope,element,attrs,controller,transcludeFn){
            element.data(
                ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngTemplate),
                ngHtmlBuilderModule.collect(element,attrs)
            );
        }
    }}).directive(ngHtmlBuilderModule.ngUse,function(){return {
        restrict:"E",
        link:function(scope,element,attrs,controller,transcludeFn){
            //Do nothing
        }
    }}).directive(ngHtmlBuilderModule.ngClone,function(){return {
        restrict:"E",
        link:function(scope,element,attrs,controller,transcludeFn){
            var selector="";
            element.data(
                ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngClone),
                ngHtmlBuilderModule.collect(element,attrs)
            );
            if (angular.isUndefined(attrs[ngHtmlBuilderModule.ngSelector])) {
                console.warn("WARN: Unable to find selector (attribute \""+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngSelector)+"\") in "+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngClone)+" element");
                element.remove();
            } else try {
                var mark="ng-tmp-"+ngHtmlBuilderModule.randomString();//Mark current element
                selector=attrs[ngHtmlBuilderModule.ngSelector];//Get selector of template element
                var template=angular.element(document.querySelector(selector));//Get template element
                var replace={};//Replace 
                ngHtmlBuilderModule.merge(
                    template.data(ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngTemplate)),
                    replace
                );//Get replace array from template element
                ngHtmlBuilderModule.merge(
                    element.data(ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngClone)),
                    replace
                );//Get replace array from current element
                template=template.clone();//Clone template
                template.html(ngHtmlBuilderModule.replace(template.html(),replace));//Replace all strings in template.
                element.addClass(mark);
                var traverse=function(template,current,replace,tool){//Traverse across nested elements
                    if (tool(template,current,replace)){
                        var items=template.children();
                        for(var i=0;i<items.length;i++) traverse(items.eq(i),current,replace,tool);
                    }
                };
                traverse(template,element,replace,function(template,current,replace){
                    var name=null;
                    var type=null;
                    if (template[0]) {
                        name=template[0].nodeName.toLowerCase();
                        type=template[0].nodeType;
                    }
                    if ((type!=1)||(name!=ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngUse))) {
                        return(true);//Go deeper
                    } else {
                        var a=template.attr(ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngSelector));
                        if (!a) {
                            console.warn("WARN: Unable to find selector (attribute \""+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngSelector)+"\") in "+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngUse)+" element");
                        } else try {
                            var found=angular.element(document.querySelectorAll("."+mark+" "+a));//Find in current element
                            if (found[0]){//If found then use it
                                template.replaceWith(found);
                            } else {//If not found then use children of template elements (default content)
                                template.replaceWith(template.children().clone());
                                return(true);//Go deeper
                            }
                        } catch (e){
                            console.error("ERROR: Unable to find "+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngUse)+" element (selector: \""+a[ngHtmlBuilderModule.ng_use]+"\")");
                        }
                    }
                    return(false);//Don't go deeper
                });
                element.removeClass(mark);
                template.removeClass(ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngTemplate));
                if (template[0]) if (template[0].id) template[0].id=template[0].id+"-"+ngHtmlBuilderModule.randomString();
                element.replaceWith(template);//Replace current element with tamplate
            } catch (e){
                console.error("ERROR: Unable to find "+ngHtmlBuilderModule.snake_case(ngHtmlBuilderModule.ngTemplate)+" element (selector: \""+selector+"\")",e);
                element.remove();
            }
        }
    }});