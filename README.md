# ngHtmlBuilder

ngHtmlBuilder is AngularJS module for HTML templating. 
It is similar to transclude feature except that all necessary for template information is placed directly in HTML.

The module defines four new directives:
* `ng-template` - Defines a template in HTML;
* `ng-clone` - Instantiates HTML element from the template;
* `ng-use` - Puts HTML elements given when cloning inside the template;
* `ng-include-once` - Adds HTML from given source (but only if not added before).

## Usage

In order to use ngHtmlBuilder module it must be added after Angular link.

Like this (URLs must be corrected accordingly):
```html
<script src="ngHtmlBuilder.js"></script>
<link rel="stylesheet" href="ngHtmlBuilder.css">
```

## Examples

### Simple example

First, template must be defined.

Template:
```html
<span class="ng-template" id="template-1">example</span>
```


The template must have `ng-template` class assigned (it's removed during cloning)
and may have it's own unique ID (it's suffixed with random string during cloning).

Then, the template may be instantiated anywhere, as many times is needed.

Clone before compilation:
```html
<ng-clone ng-selector="#template-1"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-1-nn8gdge5at630dbnmm5u"><span class="ng-scope">example</span></span>
```

Element `ng-clone` is replaced (entirely) by selected template. 
Selection is made by `ng-selector` attribute, where proper selector should be given 
(in order to find proper template). Search is done in `document` context 
(first occurrence).

### String parameters

In the template a string parameter may be used.

Template:
```html
<span class="ng-template" id="template-2">$test$</span>
```

The name of the parameter (here `$test$`) must have dollar sign
at the beginning and at the end. 
Each occurrence of the name of such parameter will be replaced 
with value during cloning (only if value is given).

A value can be provided as attribute of `ng-clone` element with the same name.

Clone before compilation:
```html
<ng-clone ng-selector="#template-2" $test$="Ala ma kota"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-2-zwemog0z2570axe1y23rf"><span class="ng-scope">Ala ma kota</span></span>
```

Clone before compilation:
```html
<ng-clone ng-selector="#template-2" $test$="Ala ma dwa koty"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-2-hrab7ivzrd8vgh6jybw04"><span class="ng-scope">Ala ma dwa koty</span></span>
```

If the value is not provided in `ng-clone` element it won't be replaced.

Clone before compilation:
```html
<ng-clone ng-selector="#template-2"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-2-dvgqif0vxa9nczn01cll8"><span class="ng-scope">$test$</span></span>
```

To solve this problem a default value may be provided in the template element.
It has to be an attribute of top most template element with the same name.

Template:
```html
<span class="ng-template" id="template-3" $test$="Wartość domyślna">$test$</span>
```

Clone before compilation:
```html
<ng-clone ng-selector="#template-3" $test$="Ala nie ma kota"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-3-4rsvaeqarvre3ats2xqs"><span class="ng-scope">Ala nie ma kota</span></span>
```

Clone before compilation:
```html
<ng-clone ng-selector="#template-3"></ng-clone>
```
Clone after compilation:
```html
<span class="" id="template-3-s9r8jib5prr080n7cfg2wix"><span class="ng-scope">Wartość domyślna</span></span>
```

### Input elements

The template may use an HTML element that is provided during cloning.
In such case `ng-use` directive must be placed in template.

Template:
```html
<div class="panel panel-default ng-template" id="template-4">
    <div class="panel-body">
        <ng-use ng-selector="[template-content='1']"></ng-use>
    </div>
</div>
```

When template is cloned `ng-clone` may have child elements.
In this context `ng-use` directive searches 
for elements that will replace it. 
Selector from `ng-selector` attribute is used for this purpose.

Clone before compilation:
```html
<ng-clone ng-selector="#template-4">
    <span template-content="1">Tutaj tekst</span>
</ng-clone>
```
Clone after compilation:
```html
<div class="panel panel-default" id="template-4-bc3r4080plsn5vmdsly9">
    <div class="panel-body ng-scope">
        <span template-content="1">Tutaj tekst</span>
    </div>
</div>
```

If no input HTML elements was found during cloning, default content will be used.
The default content may be provided in `ng-use` element.

Template:
```html
<div class="panel panel-default ng-template" id="template-5">
    <div class="panel-body">
        <ng-use ng-selector="[template-content='1']">
            <span>Domyślna treść</span>
        </ng-use>
    </div>
</div>
```

Clone before compilation:
```html
<ng-clone ng-selector="#template-5">
    <span template-content="1">Tutaj tekst</span>
</ng-clone>
```
Clone after compilation:
```html
<div class="panel panel-default" id="template-5-rl2qpcmcg4c37pr5j5q28x">
    <div class="panel-body ng-scope">
        <span template-content="1">Tutaj tekst</span>
    </div>
</div>
```

Clone before compilation:
```html
<ng-clone ng-selector="#template-5"></ng-clone>
```
Clone after compilation:
```html
<div class="panel panel-default" id="template-5-7jsorqydiet74yyhumtvvt">
    <div class="panel-body ng-scope">
        <span>Domyślna treść</span>
    </div>
</div>
```

### Include HTML

Templates may be defined in different files and then included to the main HTML.
In order to do that `ng-include-once` directive must be used.
```html
<ng-include-once src="'example.html'"></ng-include-once>
```

HTML source included this way is checked if has been loaded already.
If so, the include is omitted.