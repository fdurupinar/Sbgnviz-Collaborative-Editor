// This file is a hack, but if only for demo/starting-point
// purposes, I made it so that you can just load it in as a script
// (e.g. with the others in inde.html) and it works.

// The mutation observer below will listen for changes to the messages (<ul>)
// container and call makeItemListsCollapsible on every element that gets added
// to it as a child.

// Alternatively, if it is more ammenable to just insert a function call into the
// existing code after a message gets added, You can call makeItemListsCollapsible
// on the new message's DOM element whenever a new one gets added.  That's how we
// use this in clic.

// There are many other alternatives for how to integrate.  The function
// makeItemListsCollapsible below is the crux of wht you might find useful.

// ============================================
// Extra stuff for listening for added messages

// This mutation observer stuff is based on:
// https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
const observeDOM = (function(){
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  return function( obj, callback ){
    if( !obj || !obj.nodeType === 1 ) return; // validation
    if( MutationObserver ){
      const obs = new MutationObserver(function(mutations, observer){
          callback(mutations);
      })
      obs.observe( obj, { childList:true, subtree:false });
    }
    // A fall-back for older browsers
    else if( window.addEventListener ){
      obj.addEventListener('DOMNodeInserted', callback, false);
      obj.addEventListener('DOMNodeRemoved', callback, false);
    }
  }
})();

// Wait until document ready so that the messages will be in the DOM
$(document).ready(function(){

  // Looks like the messages stick around through page refresh.
  // This bit ensures that item lists are recollapsed if that happens.
  $(".message").each(function (index, message) {
    makeItemListsCollapsible(message)
  })
  
  // Observe the messages container for changes to it's direct children,
  // but NOT its other descendants ({ childList:true, subtree:false) above).
  // This avoids infinite regress, since we'll be modifying descendants.
  // (makeItemListsCollapsible doesn't guard again infinite regress, as is)
  observeDOM( document.getElementById("messages"), function(m){ 
    const addedNodes = [], removedNodes = [];
    m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes))
    m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes))
    // The addedNodes are messages plus a couple other "comments", which should be unaffected
    $.each(addedNodes, function( index, message ) {
      makeItemListsCollapsible(message)
    })
  })
})

// ==============================================
// The piece that finds every contained item-list
// in the element and makes it collapsible

function makeItemListsCollapsible (element) {
  // Make instances of the class 'item-list' collapsible
  $('span.item-list', element)
    .each(function () { makeCollapsible(this) })
}

// If it looks like a list of more than the threshold
// (18 by default), then add a collapsed view of the
// list, and add links before the expanded (original)
// and collapsed views to hide/show, respectively.
// Each link hides its corresponding (parent) view and
// shows the opposite view.
function makeCollapsible (span, threshold = undefined) {
  const content = span.innerHTML
  const commaSeparated = content.split(',')
  const count = commaSeparated.length
  const defaultThreshold = 18
  
  // To determine the threshold, we will first look to the (optional)
  // argument passed in above, then to the class, then fallback to the
  // default (18)
  const thresholdMatch = span.className.match(/threshold-(\S+)/)
  if (typeof threshold === "number") { // no-op
  }
  if (thresholdMatch && thresholdMatch[1] && parseInt(thresholdMatch[1])) {
    threshold = parseInt(thresholdMatch[1])
  } else {
    threshold = defaultThreshold
  }
  
  if (count > threshold) {
    const expanded = span
    const id = span.id
    const typeMatch = span.className.match(/(\S+)-type/)
    let plural = 'items'  // default
    if (typeMatch && typeMatch[1]) {
      plural = typeMatch[1] + 's'
    }
    
    // Insert collapsed version
    const collapsed = $('<span/>').insertBefore(span)
          .attr('id', id + '-collapsed')
          .attr('class', 'collapsed-list')
          .html(function () { return abbreviate(expanded.innerHTML) })
          .get(0)
    
    // append "Show" link to collapsed version
    $('<a>', {
      text: '(Show all ' + count + ' ' + plural + ')',
      title: 'Show ' + plural,
      href: '#',
      click: function () {
        $(expanded).css('display', 'inline')
        $(collapsed).css('display', 'none')
      }
    }).appendTo(collapsed)
    
    // prepend "Hide" link to expanded version
    $(expanded).prepend(' ')
    $('<a>',{
      text: '(Hide)',
      title: 'Hide ' + plural,
      href: '#',
      click: function () {
        $(collapsed).css('display', 'inline')
        $(expanded).css('display', 'none')
      }
    }).prependTo(expanded)
    
    //start by making the collapsed version visible and hiding the expanded
    $(collapsed).css('display', 'inline')
    $(expanded).css('display', 'none')
  }
}

// This method of abbreviation will not handle a string containing tags well.
function abbreviate (str) {
  // Cut it off at the last comma in the first 30 characters, or the first comma,
  // whichever comes later, but never go past 60 characters (in the case of non-comma-separated lists)
  const hackedStr = str.substring(0, 30)
  const firstComma = str.indexOf(',')
  const lastComma = hackedStr.lastIndexOf(',')
  const cutoff = Math.min(30, Math.max(firstComma, lastComma))
  return str.substring(0, cutoff) + ', ... '
}
