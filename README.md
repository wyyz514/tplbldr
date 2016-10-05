# tplbldr

## Description
Javascript micro-library to ease the task of populating templates with data. This is done by employing the use of a parent container element which has the capability of adding features (listeners, styling etc) to its children as well as setting the content of the children tags using attributes. These attributes are set by the user to match the property key in the data set. If a particular attribute doesn't exist in the data set, the user can specify some `buildProps` which will be used as a fall back in the event that a specified attribute is not available in the data set.

## API
- prepare
- build
- setProps
- getBuiltTemplate
- combine

## Examples
