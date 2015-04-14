var entityMap = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': '&quot;', "'": '&#39;', "/": '&#x2F;'},
clearText = function(txt){
	if (/\S/.test(txt)) {
		return txt.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').replace(/[&<>"'\/]/g, function (s) {
			return entityMap[s];
		});
	}
},
forbiddenTags = ['script', 'style', 'frame', 'iframe', 'meta', 'link', 'img'],
extractTextFromNode = function(n){
	for (var j = 0; j < forbiddenTags.length; j++) {
		$(forbiddenTags[j], n).remove();
	}
	var nHtml = n.innerHTML.replace(/</gm, ' <');
	var txt = (new DOMParser()).parseFromString(nHtml, 'text/html').body.innerText || '';
	txt = txt.replace(/(\n|\r)/gm, ' ').replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
	return txt;
},
extractTextFromRange = function(range){
	var result = '';
	try {
		var clonedContent = range.cloneContents();
		var nodes = clonedContent.children || clonedContent.childNodes;
		var texts = [];
		for (var i = 0, len = nodes.length; i < len; i++) {
			var txt = extractTextFromNode(nodes[i]);
			if (/\S/.test(txt)) {
				texts.push(txt);
			}
		}
		result = texts.join(' ');
	} catch(e) {
		if (window.console) {
			console.error(e);
		}
		result = clearText(range.toString());
	}
	return result;
},
getSelectionText = function() {
	var text = '';
	if (window.getSelection) {
		text = window.getSelection().toString();
	} else if (document.selection && document.selection.type != 'Control') {
		text = document.selection.createRange().text;
	}
	return clearText(text);
},
getSelectedPhrase = function(){
	try{
		var nodes = [], texts = [], selection;
	    if (window.getSelection) {
	    	selection = getSelection();
			for (var i = 0, len = selection.rangeCount; i < len; i++) {
				var rangeObj = selection.getRangeAt(i),
					startContainer = rangeObj.startContainer,
					endContainer = rangeObj.endContainer;
				if (startContainer) {
					nodes.push(startContainer.nodeName === "#text" ? startContainer.parentNode : startContainer);
				}
				if (endContainer) {
					nodes.push(endContainer.nodeName === "#text" ? endContainer.parentNode : endContainer);
				}
			}
			if (nodes.length === 0) {
				nodes = [selection.anchorNode];
			}
	    }
	    if (!nodes.length && document.selection) {
	    	selection = document.selection;
	    	var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
	    	var node = range.commonAncestorContainer ? range.commonAncestorContainer :
	    			range.parentElement ? range.parentElement() : range.item(0);
			if (node) {
				nodes = [node];
			}
	    }

		for (var i = 0, nLen = nodes.length; i < nLen; i++) {
			var node = nodes[i];
			if (node.nodeName == "#text") {
				node = node.parentNode;
			}
			try {
				texts.push(extractTextFromNode(node));
			} catch(e) {
				if (window.console) {
					console.error(e);
				}
				texts.push($(node).text());
			}
		}
		return texts.join(' ');
	} catch (e) {
		if (window.console) {
			console.error(e);
		}
	}
},
getAroundSelectedText = function(containerEl){
	// http://stackoverflow.com/a/9000719
	var sel, range, tempRange, before = "", after = "";
    if (typeof window.getSelection != "undefined") {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
        } else {
            range = document.createRange();
            range.collapse(true);
        }
        tempRange = document.createRange();
        tempRange.selectNodeContents(containerEl);
        tempRange.setEnd(range.startContainer, range.startOffset);
        before = extractTextFromRange(tempRange);

        tempRange.selectNodeContents(containerEl);
        tempRange.setStart(range.endContainer, range.endOffset);
        after = extractTextFromRange(tempRange);
    } else if ((sel = document.selection) && sel.type != "Control") {
        range = sel.createRange();
        tempRange = document.body.createTextRange();
        tempRange.moveToElementText(containerEl);
        tempRange.setEndPoint("EndToStart", range);
        before = clearText(tempRange.text || '');

        tempRange.moveToElementText(containerEl);
        tempRange.setEndPoint("StartToEnd", range);
        after = clearText(tempRange.text || '');
    }

    return {'before': before, 'after': after};
};
