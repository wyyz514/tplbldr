/**
  tplbuilder.js
  -------------

  Helper 'class' to help in building templates
  using data to set content in the dom.

  All templates are
  wrapped in an element and that element is used to locate elements, defined in the template string,
  with the 'with-attr' class attribute. These targeted elements are then
  given content, based on the 'data-attr' they specify. These 'data-attr's
  are usually keys in the data object but can be passed in as otherProps (check build function)
*/

/**
  TplBuilder constructor
  ----------------------
  Takes in the template as an object with properties like
  listeners and the template wrapper,
  Data as an array,
  DomTarget as a string; this targets the element the built template
  will be appended to
*/
function TplBuilder(template, data, domTarget) {
    this.template = template;
    this.data = data;
    this.children = '';
    this.domTarget = domTarget;
}


/**
  Prepare
  -------
  This function will create the template wrapper element
  and append the template (tpl key in the required template object) constructor as its child/children.
  The wrapper will then add any listeners specified to the target elements
  and the function will return the wrapper created.
*/
TplBuilder.prototype.prepare = function() {
    var self = this;
    var elToReturn = null;

    try {
        if (this.template.wrapper) {
            var wrapper = this.template.wrapper;
            var el = wrapper.el; //element name ie div, p, span, section etc
            var classList = wrapper.classList; //classes to add to the template wrapper's classList
            var listeners = wrapper.listeners; //listeners to be added to the children elements

            //if the template wrapper is defined with a desired element name,
            //that element is created and class attributes added as well as listeners
            if (el) {
                elToReturn = document.createElement(el);

                if (classList) {
                    var classes = classList.join(" ");
                    elToReturn.setAttribute("class", classes);
                }
            }
            //append the tpl string to the template wrapper
            elToReturn.innerHTML = this.template.tpl;

            if (listeners) {
                listeners.map(function(l) {
                    //find the element(s) to add the listener to
                    var targetEl = elToReturn.querySelectorAll(l.target);
                    var targetElArray = helpers.makeArray.call(targetEl);
                    targetElArray.map(function(target) {
                        target.addEventListener(l.ev, l.handler);
                    });
                });
            }
        }
    }
    catch (e) {
        throw new Error("[ TplBuilder->prepare ] " + e);
    }
    return elToReturn;
}

/**
  setProps
  --------
  This function will locate the children of the wrapper with the
  'with-attr' class and populate the data based on the data-attr specified
*/
TplBuilder.prototype.setProps = helpers.setProps;


TplBuilder.prototype.appendToDom = function(content) {
    var appendToParent = helpers.appendTo(this.domTarget)(content);
}

/**
  empty
  -----
  This function can be used to set an empty template.
  The empty template should be defined in the same object as
  the non-empty template
*/
TplBuilder.prototype.empty = function() {
    var domTarget = document.querySelector(this.domTarget);
    if (!domTarget) {
        throw new Error("[ TplBuilder->empty ] Could not find target specified");
    }
    else {
        domTarget.innerHTML = this.template.empty;
    }
}


/**
  build
  -----
  This function builds the template by
    - Creating the wrapper element
    - Setting the properties of the elements, with the 'with-attr' class, in the template
    - returning the built template as html
    - if an extra property needs to be set on any element, this can be specified in the constructor
      as a 4th argument. Useful for obtaining properties needed in urls
      eg (setting data-id on a button for use in a url when the button is clicked)
*/
TplBuilder.prototype.build = function() {
    var otherProps = arguments[0] ? arguments[0] : null;
    var itemContainer = this.prepare();
    //returns a function expecting the template wrapper element as an argument
    var setItemProps = this.setProps("data-attr", this.data, otherProps);
    //returns the built template with the data filled out
    var readyItem = setItemProps(itemContainer);

    return readyItem;
}

/**
  TplBuilder.combine
  -------
  This static function allows templates to be combined.
  It will take an array of built templates as the first argument;
  The domTarget as the second and a boolean value to specify whether or
  not to render the template immediately. The template can be manually rendered
  by using the helper function 'appendTo' and specifying a domTarget. It may be
  necessary to iterate through the returned array when appending.
*/

TplBuilder.combine = function(tplBuilders, domTarget, render) {
    var domTargetEl = document.querySelector(domTarget);
    var combined = tplBuilders.reduce(function(prev, next) {
        //make a 1-D array of built templates
        return prev.concat(next);
    }, []).map(function(elTemplate) {
        //if render, then append to the DOM immediately
        if (render)
            helpers.appendTo(domTarget)(elTemplate);
        return elTemplate;
    });
    //string that can be appended to DOM whenever
    return combined;
}

/**
  getBuiltTemplate
  ----------------
  This function is a wrapper around the build function
  and is used when similar templates with different data need to be created.
  Think contact lists or blog titles with blurbs or something along those lines.
  In other words, for data collections, use this function
  Takes in arguments:
    -tpl object
    -data set
    -domTarget as a string
    -otherProps/otherBuildProps (useful for filling in gaps when data
     does not have the key specified in the data-attr property of the element
     or for overwriting default values).
  -----------------
*/
TplBuilder.getBuiltTemplate = function getBuiltTemplate(tpl, data, domTargetSelector, otherBuildProps, render) {
    var alreadyBuiltTpls = data.map(function(d) {
        var tplBuilder = new TplBuilder(tpl, d, domTargetSelector);
        if (d.hasOwnProperty(tpl.childrenKey)) {
            tplBuilder.children = TplBuilder.getBuiltTemplate(tpl, d.children, null, null, false);
            otherBuildProps = otherBuildProps ? otherBuildProps : {};
            otherBuildProps['$children'] = tplBuilder.children;
        }
        var tplWithProps = otherBuildProps ? tplBuilder.build(otherBuildProps) : tplBuilder.build();
        if (render) {
            tplBuilder.appendToDom(tplWithProps);
        }
        return tplWithProps.outerHTML;
    });
    return alreadyBuiltTpls;
};
