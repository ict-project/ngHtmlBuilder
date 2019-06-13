var ngHtmlBuilderModule=new function(){
    var promiseChain=new Promise(function(resolve,reject){resolve(false);});
    this.addPromise=function(next){
        promiseChain=promiseChain.then(function(){return(next);});
    };
    this.htmlBlockTable={};
    this.sha256=function(input){
        if (window.crypto){
            const encoder=new TextEncoder();
            const data=encoder.encode(input);
            var output=window.crypto.subtle.digest('SHA-256',data);
            if (output.result) return(new Promise(function(resolve,reject){resolve(output.result);}));
            return(output);
        }
        console.warn("WARN: Module window.crypto not present!!!");
        return(new Promise(function(resolve,reject){resolve(false);}));
    };
    this.buf2hex=function(buffer){
        return(Array.prototype.map.call(new Uint8Array(buffer),x=>('00'+x.toString(16)).slice(-2)).join(''));
    };
    this.normalizeSelector=function(input){
        return(input.replace(/\[([\w\-]+)([\~\|\^\$\*])?=\'([^\']*)\'\]/gi,"[$1$2=\"$3\"]"));
    };
    //Source: https://github.com/angular/angular.js/blob/v1.3.10/src/Angular.js#L1447-L1453
    this.snake_case=function(name){
        return name.replace(/[A-Z]/g,function(letter,pos){
            return (pos?'-':'')+letter.toLowerCase();
        });
    };
    //Gets random string
    this.randomString=function(){
        return(Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15));
    };
    //Collects replace strings from attrs
    this.collect=function(element,attrs){
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
    };
    //Merge replace strings in one object
    this.merge=function(input,output) {
        for (var key in input) 
            if (input.hasOwnProperty(key)) 
                output[key] = input[key];
    };
    //Replace strings
    this.replace=function(input,replace) {
        var output=new String(input);
        for (var key in replace) 
            if (replace.hasOwnProperty(key)) {
                var regex=new RegExp(key.replace(/\$/g,"\\$"),"gi");
                output=output.replace(regex,replace[key]);
            }
        return(output);
    };
    this.ngIncludeOnce="ngIncludeOnce";
    this.ng_include_once=this.snake_case(this.ngIncludeOnce);
    this.ngTemplate="ngTemplate";
    this.ng_template=this.snake_case(this.ngTemplate);
    this.ngUse="ngUse";
    this.ng_use=this.snake_case(this.ngUse);
    this.ngClone="ngClone";
    this.ng_clone=this.snake_case(this.ngClone);
    this.ngSelector="ngSelector";
    this.ng_selector=this.snake_case(this.ngSelector);
}();
angular.module(
    "ngHtmlBuilder",
    []
    ).directive(ngHtmlBuilderModule.ngIncludeOnce,function($compile){return {
        restrict:"E",
        link:function(scope,element,attrs,controller,transcludeFn){
            var html=element.html();
            element.html("");
            ngHtmlBuilderModule.addPromise(ngHtmlBuilderModule.sha256(html).then(function(hash){
                if (hash) {
                    hash=ngHtmlBuilderModule.buf2hex(hash);
                    var key="k"+hash;
                    if (ngHtmlBuilderModule.htmlBlockTable[key]){
                        console.debug("DEBUG: HTML block loaded already: "+hash+" at "+ngHtmlBuilderModule.htmlBlockTable[key].toString());
                        html=false;
                    } else {
                        ngHtmlBuilderModule.htmlBlockTable[key]=new Date();    
                    }
                }
                if (html){
                    var el=angular.element(html);
                    $compile(el.contents())(scope);
                    element.replaceWith(el);
                    console.debug("DEBUG: New HTML block: "+hash);
                } else {
                    element.remove();
                }
            }));
        }
    }}).directive(ngHtmlBuilderModule.ngTemplate,function(){return {
        restrict:"C",
        link:function(scope,element,attrs,controller,transcludeFn){
            element.data(
                ngHtmlBuilderModule.ng_template,
                ngHtmlBuilderModule.collect(element,attrs)
            );
        }
    }}).directive(ngHtmlBuilderModule.ngUse,function(){return {
        restrict:"E",
        link:function(scope,element,attrs,controller,transcludeFn){
            //Do nothing
        }
    }}).directive(ngHtmlBuilderModule.ngClone,function($compile){return {
        restrict:"E",
        link:function(scope,element,attrs,controller,transcludeFn){
            var selector="";
            element.data(
                ngHtmlBuilderModule.ng_clone,
                ngHtmlBuilderModule.collect(element,attrs)
            );
            if (angular.isUndefined(attrs[ngHtmlBuilderModule.ngSelector])) {
                console.warn("WARN: Unable to find selector (attribute \""+ngHtmlBuilderModule.ng_selector+"\") in "+ngHtmlBuilderModule.ng_clone+" element");
                element.remove();
            } else try {
                var mark="ng-tmp-"+ngHtmlBuilderModule.randomString();//Mark current element
                selector=attrs[ngHtmlBuilderModule.ngSelector];//Get selector of template element
                var template=angular.element(document.querySelector(ngHtmlBuilderModule.normalizeSelector(selector)));//Get template element
                var replace={};//Replace 
                ngHtmlBuilderModule.merge(
                    template.data(ngHtmlBuilderModule.ng_template),
                    replace
                );//Get replace array from template element
                ngHtmlBuilderModule.merge(
                    element.data(ngHtmlBuilderModule.ng_clone),
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
                    if ((name!=ngHtmlBuilderModule.ng_use)||(type!=1)) {
                        return(true);//Go deeper
                    } else {
                        var a=template.attr(ngHtmlBuilderModule.ng_selector);
                        if (!a) {
                            console.warn("WARN: Unable to find selector (attribute \""+ngHtmlBuilderModule.ng_selector+"\") in "+ngHtmlBuilderModule.ng_use+" element");
                        } else try {
                            var found=angular.element(document.querySelectorAll("."+mark+" "+ngHtmlBuilderModule.normalizeSelector(a)));//Find in current element
                            if (found[0]){//If found then use it
                                template.replaceWith(found);
                            } else {//If not found then use children of template elements (default content)
                                template.replaceWith(template.children().clone());
                                return(true);//Go deeper
                            }
                        } catch (e){
                            console.error("ERROR: Unable to find "+ngHtmlBuilderModule.ng_use+" element (selector: \""+a+"\")",e);
                        }
                    }
                    return(false);//Don't go deeper
                });
                element.removeClass(mark);
                template.removeClass(ngHtmlBuilderModule.ng_template);
                if (template[0]) if (template[0].id) template[0].id=template[0].id+"-"+ngHtmlBuilderModule.randomString();
                $compile(template.contents())(scope);
                element.replaceWith(template);//Replace current element with tamplate
            } catch (e){
                console.error("ERROR: Unable to find "+ngHtmlBuilderModule.ng_template+" element (selector: \""+selector+"\")",e);
                element.remove();
            }
        }
    }});