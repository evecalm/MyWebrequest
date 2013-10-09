var qrelm = document.getElementById('qrcode'),
	text = document.getElementById('text'),
	makeBtn = document.getElementById('make'),
	prompt = document.getElementById('prompt'),
	actionTip = document.getElementById('action-tip'),
	content = '',
	qrcode = new QRCode(qrelm, {
		width : 200,
		height : 200
	});
	//set correct Level to the lowest
chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    var tab = tabs[0];
    content = tab.url;
    try {
    	qrcode.makeCode(content);
    } catch(e) {
    	qrelm.innerHTML = '<code>' + e.message + '</code>';
    }
});

function makeQRCode () {
	prompt.innerHTML = chrome.i18n.getMessage('pop_get_new');
	content = text.value;
	try {
    	qrcode.makeCode(content);
    } catch(e) {
    	// qrelm.innerHTML = '<code>Too many words, can\'t make a QRCode</code>';
    	qrelm.innerHTML = '<code>' + e.message + '</code>';
    }
	qrelm.style.display = 'block';
	actionTip.innerText = chrome.i18n.getMessage('pop_action_tip');
	qrelm.focus();
}

qrelm.addEventListener('dblclick',function (e) {
	prompt.innerText = chrome.i18n.getMessage('pop_edit_promp');
	actionTip.innerText = chrome.i18n.getMessage('pop_edit_tip');
	this.style.display = 'none';
	text.value = content;
	text.select();
	text.focus();
},false);

text.addEventListener('keydown',function (e) {
	if (e.ctrlKey && e.keyCode === 13) {
		makeQRCode();
	}
},false);

makeBtn.addEventListener('click',makeQRCode,false);