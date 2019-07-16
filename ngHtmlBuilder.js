(function(a){
    var m=new function(){
        var count=0;
        this.getCount=function(){
            return(count++);
        };
        var promiseChain=new Promise(function(resolve,reject){resolve(false);});
        this.addPromise=function(next){
            promiseChain=promiseChain.finally(next);
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
            a.forEach(attrs,function(value,key){
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
            var output=input;
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
    a.module(
        "ngHtmlBuilder",
        []
        ).directive(m.ngIncludeOnce,function($compile,$templateRequest){return {
            restrict:"E",
            priority: 1000,
            link:function(scope,element,attrs,controller,transcludeFn){
                var data={no:m.getCount()};
                if (!attrs.src) {
                    console.warn("WARN: Unable to find attribute \"src\") in "+m.ng_include_once+" element");
                    element.remove();
                } else try {
                    data.src=scope.$eval(attrs.src);
                    m.addPromise(function(){
                        return($templateRequest(data.src,true).then(function(html){
                            data.html=html;
                        }));
                    });
                    m.addPromise(function(){
                        return(m.sha256(data.html).then(function(hash){
                            var replace=true;
                            if (hash) {
                                hash=m.buf2hex(hash);
                                data.hash=hash;
                                var key="k"+hash;
                                if (m.htmlBlockTable[key]){
                                    console.debug("DEBUG: File include ("+data.src+") loaded already: "+hash+" at "+m.htmlBlockTable[key].toString(),data.no);
                                    replace=false;
                                } else {
                                    m.htmlBlockTable[key]=new Date();    
                                }
                            }
                            if (replace){
                                var template=a.element(data.html);
                                $compile(template)(scope);
                                element.replaceWith(template);                                   
                                console.debug("DEBUG: New file include ("+data.src+"): "+hash,data.no);
                            } else {
                                element.remove();
                            }
                        }))
                    });
                } catch (e){
                    console.error("ERROR: "+m.ng_include_once+" (\""+attrs.src+"\")",data.no,e);
                    element.remove();
                }
                console.debug("DEBUG: Include init "+m.ng_include_once,data.no,attrs.src);
            }
        }}).directive(m.ngTemplate,function(){return {
            restrict:"C",
            priority: 1000,
            link:function(scope,element,attrs,controller,transcludeFn){
                element.data(
                    m.ng_template,
                    {replace:m.collect(element,attrs),html:element[0].outerHTML}
                );
                element.empty();
            }
        }}).directive(m.ngUse,function(){return {
            restrict:"E",
            link:function(scope,element,attrs,controller,transcludeFn){
                //Do nothing
            }
        }}).directive(m.ngClone,function($compile){return {
            restrict:"E",
            priority: 500,
            link:function(scope,element,attrs,controller,transcludeFn){
                var data={no:m.getCount()};
                m.addPromise(function(){
                    if (!element[0]) return(null);
                    if (!element[0].parentNode) return(null);
                    var selector="";
                    element.data(
                        m.ng_clone,
                        {replace:m.collect(element,attrs)}
                    );
                    if (a.isUndefined(attrs[m.ngSelector])) {
                        console.warn("WARN: Unable to find selector (attribute \""+m.ng_selector+"\") in "+m.ng_clone+" element",data.no);
                        element.remove();
                    } else try {
                        var mark="ng-tmp-"+m.randomString();//Mark current element
                        selector=attrs[m.ngSelector];//Get selector of template element
                        var template=a.element(document.querySelector(m.normalizeSelector(selector)));//Get template element
                        var template_data=template.data(m.ng_template);
                        var clone_data=element.data(m.ng_clone);
                        var replace={};//Replace 
                        m.merge(template_data.replace,replace);//Get replace array from template element
                        m.merge(clone_data.replace,replace);//Get replace array from current element
                        var template_html=m.replace(template_data.html,replace);//Replace all strings in template.
                        template=a.element(template_html);
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
                            if ((name!=m.ng_use)||(type!=1)) {
                                return(true);//Go deeper
                            } else {
                                var s=template.attr(m.ng_selector);
                                if (!s) {
                                    console.warn("WARN: Unable to find selector (attribute \""+m.ng_selector+"\") in "+m.ng_use+" element",data.no);
                                } else try {
                                    var found=a.element(document.querySelectorAll("."+mark+" "+m.normalizeSelector(s)));//Find in current element
                                    if (found[0]){//If found then use it
                                        template.replaceWith(found);
                                    } else {//If not found then use children of template elements (default content)
                                        var children=template.children();
                                        if (children[0]){ //If are present
                                            template.replaceWith(children.clone());
                                        } else {
                                            template.remove();
                                        }
                                        return(true);//Go deeper
                                    }
                                } catch (e){
                                    console.error("ERROR: "+m.ng_use+" (selector: \""+a+"\")",data.no,e);
                                }
                            }
                            return(false);//Don't go deeper
                        });
                        element.removeClass(mark);
                        template.removeClass(m.ng_template);
                        if (template[0]) if (template[0].id) template[0].id=template[0].id+"-"+m.randomString();
                        $compile(template.contents())(scope);
                        element.replaceWith(template);//Replace current element with tamplate
                        console.debug("DEBUG: Clone ready "+m.ng_clone,data.no);
                    } catch (e){
                        console.error("ERROR: "+m.ng_template+" (selector: \""+selector+"\")",data.no,e);
                        element.remove();
                    }
                    return(null);
                });
                console.debug("DEBUG: Clone init "+m.ng_clone,data.no);
            }
        }});
})(angular);