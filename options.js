
function save_options() {
  var _address = document.getElementById('address').value;
  var _method = document.getElementById('method').value;
  var _username = document.getElementById('username').value;
  var _computername = document.getElementById('computername').value;
  chrome.storage.sync.set({
    address: _address,
    method: _method,
	username: _username,
	computername: _computername
  }, function() {
   
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
	  window.close();
    }, 2000);
  });
}


function restore_options() {

  chrome.storage.sync.get(null, function(items) {
    document.getElementById('address').value = items.address;
    document.getElementById('method').value = items.method;
	document.getElementById('computername').value = items.computername;
	document.getElementById('username').value = items.username;
  });
}

function view_har(){
  chrome.tabs.create({ url: "/result_page_har.html?id=0" });	
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
document.getElementById('viewHar').addEventListener('click',view_har);
	