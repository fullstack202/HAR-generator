
let url = new URL(location.href);
let search_params = url.searchParams; 

var hid = search_params.get('id');
var raw = search_params.get('raw');
var save = search_params.get('save');

function saveJSON(data) {
 
   let bl = new Blob([JSON.stringify(data)], {
      type: "text/html"
   });
   let a = document.createElement("a");
   a.href = URL.createObjectURL(bl);
   a.download = "har.json";
   a.hidden = true;
   document.body.appendChild(a);
   a.innerHTML = "";
   a.click();
}

chrome.storage.local.get('har_'+hid,  function(result){ 
    
	if(raw == "yes")
	{
	  document.body.innerHTML = JSON.stringify(result['har_'+hid]);	
	}
	else {
		var f = {
					brace: 0
				};
		jsonHTML = JSON.stringify(result['har_'+hid]).replace(/({|}[,]*|[^{}:]+:[^{}:,]*[,{]*)/g, function (m, p1) {
		var rtnFn = function() {
				return '<div style="text-indent: ' + (f['brace'] * 20) + 'px;">' + p1 + '</div>';
			},
			rtnStr = 0;
			if (p1.lastIndexOf('{') === (p1.length - 1)) {
				rtnStr = rtnFn();
				f['brace'] += 1;
			} else if (p1.indexOf('}') === 0) {
				 f['brace'] -= 1;
				rtnStr = rtnFn();
			} else {
				rtnStr = rtnFn();
			}
			return rtnStr;
		});
		document.body.innerHTML = jsonHTML;
	}
	if(save && save === "yes") saveJSON(result['har_'+hid]);
 });

