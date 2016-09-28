var helpers = (function(){
  var numberRegex = new RegExp(/\d/);
  var ccRegex = new RegExp(/([0-9]{4})/);
  var idRegex = new RegExp(/id/i);
  var dontCapitalize = ['and', 'to', 'of', 'with', 'avec','les', 'des', 'del', 'et', 'est', 'du'];
  var wordBetweenBraces = new RegExp(/\{(.*?)\}/);
  /**
    makeRequest
    ------------
    wrapper around jquery ajax
    can handle get and post requests
    postData (object) is passed as the second argument of the function
    a function is returned expecting the url. When executed this function
    returns a http promise which can have a success function or error function
    for performing operations on the data returned or taking action on error.
 */
  function makeRequest(method) {
    var postData;
    if(arguments[1] && typeof arguments[1] === "object") {
        postData = arguments[1];
    }
    return function getPromise(url) {
      //returns thenable ajax promise
      return $.ajax({
        method:method,
        url:url,
        data:postData ? postData : ""
      });
    }
  }

  /**
    combineProps
    ------------
    Takes a data object (from remote source usually) and any otherProps to include
    and combines these into one object for more straightforward usage
  */
  function combineProps(a, b) {
      var newObj = {}; //object to return

      //get keys of the data object
      var keys = Object.keys(a);

      //get keys of the otherProps object and add those to the 
      //keys of the data object if they don't already exist
      Object.keys(b).map(function(key){
          if(keys.indexOf(key) < 0) {
              keys.push(key);
          }
      });

      //for each of these unique keys, since we are using the data object
      //as the default source of properties, if the key exists on the data object,
      //use that value
      //else use the value of the otherProps key if it exists.
      //if both fail, then the property does not exist so return not found
      keys.forEach(function(key){
          if(a.hasOwnProperty(key) && a[key]) {
              newObj[key] = a[key];
          }
          else if(b.hasOwnProperty(key) && b[key]) {
              newObj[key] = b[key];
          }
          else {
              newObj[key] = key + " not found";
          }
      });

      //if properties are specified to be built at run time 
      //(using props from the data object),
      //append the built property to the newObj
      if(b['toBuild']) {
        var keys = Object.keys(b['toBuild']);
        var newProp = "";
        keys.map(function(key){
            b['toBuild'][key].map(function(prop){
                if(a[prop])
                  newProp += a[prop] + " ";
                else {
                  newProp = "";
                  return;
                }
            });
            newObj[key] = newProp;
        });
      }

      //if some properties need formatting
      if(b['toFormat']) {
        b['toFormat'].map(function(key){
          if(newObj[key]) {

            newObj[key] = formatters[key](newObj[key]);
          }
        });
      }

      if(b['toLink']) {
        b['toLink'].map(function(paramLink){
          var linkWithParam = paramLink["link"];
          try {
            var paramKey = wordBetweenBraces.exec(linkWithParam)[1];
            if(!paramKey)
              throw new Error("paramKey not found in toLink: can't find anything between braces");
            else {
              //asin hack
              var replacementParam = a[paramKey] ? a[paramKey] : a[paramLink.fallbackParam];
              var linked = linkWithParam.replace("{"+paramKey+"}", replacementParam);
              var newProp = paramLink['attrToFill'];
              newObj[newProp] = linked;
            }
          }catch(e) {
            console.log(e);
          }
        });
      }
      return newObj;
  }

/**
  setProps
  --------
  uses parent element to find children
  with attr specified and obj to populate
  ie <div data-attr='name'></div> will be populated with
  obj.name
*/
 function setProps(attr, obj) {

   var otherProps = arguments[2];
   //returns a function expecting the wrapper element
   return function setPropsOn(el) {
     var data = otherProps? combineProps(obj, otherProps) : obj;
     var childrenWithAttr = el.querySelectorAll(".with-attr");
     var _childrenWithAttr = Array.prototype.slice.call(childrenWithAttr);
     var dependentChildren = Array.prototype.slice.call(el.querySelectorAll(".has-dep"));
     _childrenWithAttr.map(function(c){
         var key = c.getAttribute(attr);

         if(key === "image" || key === 'avatar') {
             c.src = data[key];
         }
         else if(idRegex.test(key))
              c.value = data[key];
         else if(key.toLowerCase().match("link")){
              c.href = data[key];
         }
         else {
             c.innerHTML = data[key] || "";
         }
     });

     dependentChildren.map(function(depChild){
        var dependency = depChild.getAttribute('data-depends');
        if(!obj[dependency] || obj[dependency] == 0 ) {
          depChild.parentElement.removeChild(depChild);
        }
     });

     return el;
   }
 }

 function toggleClass(className) {
   return function toggleClassNameOn(el) {
     var _el = document.querySelector(el);
     if(!_el) {
       console.log("Could not find element", el);
       return;
     }

     if(_el.classList.contains(className)) {
       _el.classList.remove(className);
     }
     else {
       _el.classList.add(className);
     }
     return el;
   }
 }

 function stringifyEl(el) {
   if(typeof el.reduce === "function") {
     return el.reduce(function(prev, next){
       return prev + next.outerHTML;
     }, "");
   }
   else {
     return el.outerHTML;
   }
 }

 function compose(f1, f2) {
   return function composed(x) {
     return f1(f2(x));
   }
 }

function appendTo(selector) {
  return function appendToSel(content) {
    try {
      var el = document.querySelector(selector);
      el.appendChild(content);
    }
    catch(e) {
      throw new Error(e);
    }
  }
}

function clear(selector) {
  return function clearSelected(parent) {
    var parentEl = document.querySelector(parent);
    try {
      if(selector === "*") {
        parentEl.innerHTML = "";
        return;
      }

      var childrenToRemove = Array.prototype.slice.call(parentEl.querySelectorAll(selector));
      childrenToRemove.map(function(c){
        $(c).remove();
      });
    }catch(e) {
      throw new Error(e);
    }
  }
}

function createEventHandler(handler) {
  return function eventHandler(e) {
    handler(e);
  }
}

var toggleProgressBar = function() {
    toggleClass("hidden")("#loading");
}

var createCounter = function(el) {
  return {
    up:function increment(){
       var count = parseInt(numberRegex.exec(this.innerText)[0]) + 1;
       this.innerText = this.innerText.replace(numberRegex, count);
       return count;
    }.bind(el),
    down:function decrement(){
       var count = parseInt(numberRegex.exec(this.innerText)[0]) - 1 < 0 ? 0 : parseInt(numberRegex.exec(this.innerText)[0]) - 1;
       this.innerText = this.innerText.replace(numberRegex, count);
       return count;
    }.bind(el),
    set:function set(val) {
      this.innerText = this.innerText.replace(/\d/, val);
    }.bind(el)
  };
}

function formatPrice(price) {
  var currency = arguments[1] || '$';
  var parsedPrice = parseFloat(price).toFixed(2).toString();
  var priceChunks = parsedPrice.split(".");
  var formattedPrice = ""+currency+""+ Math.round(price);
  return formattedPrice;
}

function disable(el) {
  return function disableEl() {
    $(el).prop('disabled', true);
  }
}

function enable(el) {
  return function enableEl() {
    $(el).prop('disabled', false);
  }
}

function capitalize(s) {

  if(typeof s === "string") {
    var chunks = s.toLowerCase().split(" ");
    var _chunks = chunks.map(function(c){
      if(dontCapitalize.indexOf(c.trim()) >= 0) {
        return c;
      }

      if(c.length > 0 )
        return c[0].toUpperCase().concat(c.substr(1).toLowerCase());
    });
    return _chunks.join(" ");
  }
}

var typeaheadDataTransformer = function dataTransform(response) {
    // Map the remote source JSON array to a JavaScript object array
    if(!response.data.data)
      return;
    var dataSet = response.data.data.filter(function(d){
      if(d){
        return d;
      }
    })
    .map(function(d){
            d['shortName'] = d.departement && d.code ? d.departement+" "+d.code : "Course code not found";
            d['name'] = typeof d.name === "string" ? d.name.toLowerCase() : "Name not found";
            return d;
    });
    return dataSet;
  }

var initTypeahead =   function initTypeahead(el, config) {
    var typeahead = new Typeahead(el, config);
     return typeahead;
}

function toast(message, duration, clearPrevious) {
  var classList = arguments[3] ? arguments[3] : null;
  if(clearPrevious)
    $('.toast').remove();

  Materialize.toast(message, duration, classList);
}

//from https://github.com/omarshammas/jquery.formance/blob/master/lib/jquery.formance.js
var formatPhoneNumber = function(phoneNumberString) {
    var areaCode, first3, last4, phoneNumber, text, _ref;

    phoneNumber = phoneNumberString.replace(/\D/g, '').match(/^(\d{0,3})?(\d{0,3})?(\d{0,4})?$/);
    _ref = phoneNumber, phoneNumber = _ref[0], areaCode = _ref[1], first3 = _ref[2], last4 = _ref[3];
    text = '';
    if (areaCode != null) {
      text += "(" + areaCode;
    }
    if ((areaCode != null ? areaCode.length : void 0) === 3) {
      text += ") ";
    }
    if (first3 != null) {
      text += "" + first3;
    }
    if ((first3 != null ? first3.length : void 0) === 3) {
      text += " - ";
    }
    if (last4 != null) {
      text += "" + last4;
    }
    return text;
  };

function filterBy(data, predicate) {
  return function() {
    var key = arguments[0] ? arguments[0] : "";
    return data.filter(function(datum){
      if(key) {
        if(predicate(datum[key]))
          return datum;
      }

      if(predicate(datum))
        return datum;
    });    
  }
}

var formatters = {};

formatters['price'] = formatters['price_plus_taxs'] = formatters['list_price'] = formatPrice;
formatters['name'] = formatters['textbookName'] = capitalize;
formatters['phone'] = formatPhoneNumber;

  return {
    makeRequest:makeRequest,
    setProps:setProps,
    toggleClass:toggleClass,
    compose:compose,
    stringifyEl:stringifyEl,
    appendTo:appendTo,
    clear:clear,
    createEventHandler:createEventHandler,
    toggleProgressBar:toggleProgressBar,
    createCounter:createCounter,
    disable:disable,
    enable:enable,
    capitalize:capitalize,
    dataTransform: typeaheadDataTransformer,
    initTypeahead:initTypeahead,
    toast:toast,
    format: formatters,
    filterBy:filterBy
  }
})();
