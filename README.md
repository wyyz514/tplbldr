# tplbldr

## Description
Javascript micro-library to ease the task of populating templates with data. This is done by employing the use of a parent container element which has the capability of adding features (listeners, styling etc) to its children as well as setting the content of the children tags using attributes. These attributes are set by the user to match the property key in the data set. If a particular attribute doesn't exist in the data set, the user can specify some `buildProps` which will be used as a fall back in the event that a specified attribute is not available in the data set.

## Defining templates
```js
 var data = {foo:'bar'};
 var template = {
      wrapper:{
        classList:['baz'],
        el:'div',
        listeners:[]
      },
      tpl: "<div class='with-attr' data-attr='foo'></div>"
 };
```

The template object has a wrapper key whose value defines how the parent element of the template should be created. The value of the tpl key is a html string that will be appended to the created parent element. The class `with-attr` is necessary for the parent element to find the appended template and to set the template's `innerText` to the value of the `foo` key in the dataset.

## API
### constructor
Example
```js
 var domTarget = '.targetEl';
 var tpl = new TplBuilder(templateString, data, domTarget); //initializes tplbuilder object
```
  
### prepare

- Creates the parent wrapper using the description provided in the template object's wrapper key.
- Appends the tpl value (the html string)
- Attaches listeners if any specified (more on this later)
- Finally returns an html object which is the parent element with the template (and listeners) attached.

### build

- Uses the data set provided in the constructor to populate the attributes specified on the template html string.
- Takes advantage of the `setProps` function in the `helpers.js` file in order to locate and populate elements with the targeted attribute (specified on the element in the template using the attribute `data-attr`) 
- returns the parent wrapper element with the template attributes populated. At this stage, the wrapper is ready to be appended to the DOM.

## *Note*
The `build` function can be overloaded with an object containing other properties that do not exist in the original data set. In this object, it can also be specified if properties want to be combined. For example, combining a first name and last name into a full name (more on this later)

### combine
- 'static' function
- Accepts as arguments
  - an array of built templates
  - DOM target selector string
  - boolean value specifying whether or not to immediately render the templates on the specified DOM target
- Will simply concatenate the built templates and append to the DOM target specified.

### getBuiltTemplate
- 'static' function
- Accepts as arguments
  - a template object (as described above in the _defining templates_ section)
  - a data set
  - the DOM target selector string
  - otherBuildProps object (more info in [OtherBuildProps](# OtherBuildProps))
  - a boolean value indicating whether or not to render immediately
- useful for generating templates of the same form but with different data property values. For example, contact lists, blog posts...anything list-like.

### setProps
- takes a data set and an attribute string to specify what element attribute to target. For example, the elements in the template can specify a `data-attr` attribute to indicate they need to be populated. `data-attr` will be the string passed into `setProps`
- returns a function expecting the element to use to populate the data on its child elements.
- A third argument can be passed into the `setProps` function containing other properties that should be used in the population of data on the elements.

# OtherBuildProps
Example
-------
Assume the following data set.
```js
var person = {
 first_name:"Anon",
 middle_initial:"Y.",
 last_name:"Mous",
 email:"anonymous@fakemail.com",
 id:666
}
```
The properties `first_name`, `middle_initial` and `last_name` can be built into a single property `full_name`
```js
{
 toBuild:{
   full_name:['first_name', 'middle_initial', 'last_name'] //order matters  
  },
  //maybe we want a link to the profile using the id as a parameter
  toLink: [
   {
     attrToFill:"profileLink",
     link:"/{id}/profile"
   }
  ],
  //values can also be overwritten or added
  email:"anony@mous.com",
  gender:"yes"
}
```
The email property value will be overwritten by the one specified, and the gender property will be added. Below is a more complete example showing how to use and build the template using the above objects.

## Examples
