
var version = "1.0";
localStorage._count = parseInt(localStorage._count) ? localStorage._count : 0;
var _events = [];
var uuid = 0;

const defaultOptions = {
  includeResourcesFromDiskCache: false,
  includeTextFromResponseBody: false
};

const observe = [
	  'Page.domContentEventFired',
	  'Page.fileChooserOpened',
	  'Page.frameAttached',
	  'Page.frameDetached',
	  'Page.frameNavigated',
	  'Page.interstitialHidden',
	  'Page.interstitialShown',
	  'Page.javascriptDialogClosed',
	  'Page.javascriptDialogOpening',
	  'Page.lifecycleEvent',
	  'Page.loadEventFired',
	  'Page.windowOpen',
	  'Page.frameClearedScheduledNavigation',
	  'Page.frameScheduledNavigation',
	  'Page.compilationCacheProduced',
	  'Page.downloadProgress',
	  'Page.downloadWillBegin',
	  'Page.frameRequestedNavigation',
	  'Page.frameResized',
	  'Page.frameStartedLoading',
	  'Page.frameStoppedLoading',
	  'Page.navigatedWithinDocument',
	  'Page.screencastFrame',
	  'Page.screencastVisibilityChanged',
	  'Network.dataReceived',
	  'Network.eventSourceMessageReceived',
	  'Network.loadingFailed',
	  'Network.loadingFinished',
	  'Network.requestServedFromCache',
	  'Network.requestWillBeSent',
	  'Network.responseReceived',
	  'Network.webSocketClosed',
	  'Network.webSocketCreated',
	  'Network.webSocketFrameError',
	  'Network.webSocketFrameReceived',
	  'Network.webSocketFrameSent',
	  'Network.webSocketHandshakeResponseReceived',
	  'Network.webSocketWillSendHandshakeRequest',
	  'Network.requestWillBeSentExtraInfo',
	  'Network.resourceChangedPriority',
	  'Network.responseReceivedExtraInfo',
	  'Network.signedExchangeReceived',
	  'Network.requestIntercepted'
	];
	

function generateUUID() { 
    var d = new Date().getTime();
    var d2 = (performance && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function onEvent(debuggeeId, method, params) { 
		
		if(observe.includes(method)) _events.push({ method, params });
}


chrome.debugger.onDetach.addListener(onDetach);
chrome.debugger.onEvent.addListener(onEvent);

  
chrome.browserAction.onClicked.addListener(function(tab) {
  localStorage._tabid = tab.id;
  
  if(!localStorage._active || localStorage._active == "false") 
  {
	  localStorage._active = "true";
	  console.clear();
	   var debuggeeId = {tabId:parseInt(localStorage._tabid)};
	  chrome.debugger.attach(debuggeeId, version, onAttach);
  }	  
  else 
  {   localStorage._active = "false";
      var debuggeeId = {tabId:parseInt(localStorage._tabid)};
	  chrome.debugger.detach(debuggeeId, onDetach.bind(null, parseInt(localStorage._tabid)));
  }
});

function onAttach() {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }
  uuid = generateUUID();
  chrome.browserAction.setIcon({tabId: parseInt(localStorage._tabid), path:"debuggerPause.png"});
  chrome.browserAction.setTitle({tabId: parseInt(localStorage._tabid), title:"Stop"});
  
  chrome.debugger.sendCommand({tabId: parseInt(localStorage._tabid)}, "Page.enable");
  chrome.debugger.sendCommand({tabId: parseInt(localStorage._tabid)}, "Network.enable");
	
}

function onDetach(debuggeeId) {
  localStorage._active = "false";
  uuid = 0;
  chrome.browserAction.setIcon({tabId:parseInt(localStorage._tabid), path:"debuggerContinue.png"});
  chrome.browserAction.setTitle({tabId:parseInt(localStorage._tabid), title:"Start"});
}

  
function ignoredEvents(method) {
  switch (method) {
    case 'Network.webSocketCreated':
    case 'Network.webSocketFrameSent':
    case 'Network.webSocketFrameError':
    case 'Network.webSocketFrameReceived':
    case 'Network.webSocketClosed':
    case 'Network.webSocketHandshakeResponseReceived':
    case 'Network.webSocketWillSendHandshakeRequest':
      
      break;

    case 'Network.eventSourceMessageReceived':
    
      break;

    case 'Page.frameNavigated':
    case 'Page.frameStoppedLoading':
    case 'Page.frameClearedScheduledNavigation':
    case 'Page.frameDetached':
    case 'Page.frameResized':
     
      break;

    case 'Page.lifecycleEvent':
     
      break;

    case 'Page.javascriptDialogOpening':
    case 'Page.javascriptDialogClosed':
    case 'Page.screencastFrame':
    case 'Page.screencastVisibilityChanged':
    case 'Page.colorPicked':
    case 'Page.interstitialShown':
    case 'Page.interstitialHidden':
    
      break;
    default:
      
      break;
  }
};

const urlParser = require_url;
const { v1 } = require_uuid;
const dayjs = require_dayjs;

var { parseRequestCookies, formatCookie } = require_cookies();
var { getHeaderValue, parseHeaders } = require_headers();

var {
  formatMillis,
  parsePostData,
  isSupportedProtocol,
  toNameValuePairs
} = require_utils();
var populateEntryFromResponse = entryFromResponse;
var finalizeEntry = finalizeEntry;


function harFromMessages(messages, options) {
	
	
    options = Object.assign({}, defaultOptions, options);

    const ignoredRequests = new Set(),
      rootFrameMappings = new Map();

    let pages = [],
      entries = [],
      entriesWithoutPage = [],
      responsesWithoutPage = [],
      paramsWithoutPage = [],
      currentPageId;

    for (const message of messages) {
      const params = message.params;

      const method = message.method;

      if (!/^(Page|Network)\..+/.test(method)) {
        continue;
      }

      switch (method) {
        case 'Page.frameStartedLoading':
        case 'Page.frameScheduledNavigation':
        case 'Page.navigatedWithinDocument':
          {
            const frameId = params.frameId;
            const rootFrame = rootFrameMappings.get(frameId) || frameId;
            if (pages.some(page => page.__frameId === rootFrame)) {
              continue;
            }
            currentPageId = v1();
            const title =
              method === 'Page.navigatedWithinDocument' ? params.url : '';
            const page = {
              id: currentPageId,
              startedDateTime: '',
              title: title,
              pageTimings: {},
              __frameId: rootFrame
            };
            pages.push(page);
          
            if (entriesWithoutPage.length > 0) {
              
              for (let entry of entriesWithoutPage) {
                entry.pageref = page.id;
              }
              entries = entries.concat(entriesWithoutPage);
              addFromFirstRequest(page, paramsWithoutPage[0]);
            }
            if (responsesWithoutPage.length > 0) {
              for (let params of responsesWithoutPage) {
                let entry = entries.find(
                  entry => entry._requestId === params.requestId
                );
                if (entry) {
                  populateEntryFromResponse(
                    entry,
                    params.response,
                    page,
                    options
                  );
                } else {
                  console.log(`Couln't find matching request for response`);
                }
              }
            }
          }
          break;

        case 'Network.requestWillBeSent':
          {
            const request = params.request;
            if (!isSupportedProtocol(request.url)) {
              ignoredRequests.add(params.requestId);
              continue;
            }
            const page = pages[pages.length - 1];
            const cookieHeader = getHeaderValue(request.headers, 'Cookie');

            const url = urlParser.parse(
              request.url + (request.urlFragment ? request.urlFragment : ''),
              true
            );

            const postData = parsePostData(
              getHeaderValue(request.headers, 'Content-Type'),
              request.postData
            );

            const req = {
              method: request.method,
              url: urlParser.format(url),
              queryString: toNameValuePairs(url.query),
              postData,
              headersSize: -1,
              bodySize: isEmpty(request.postData) ? 0 : request.postData.length,
              cookies: parseRequestCookies(cookieHeader),
              headers: parseHeaders(request.headers)
            };

            const entry = {
              cache: {},
              startedDateTime: '',
              __requestWillBeSentTime: params.timestamp,
              __wallTime: params.wallTime,
              _requestId: params.requestId,
              __frameId: params.frameId,
              _initialPriority: request.initialPriority,
              _priority: request.initialPriority,
              pageref: currentPageId,
              request: req,
              time: 0,
              _initiator_detail: JSON.stringify(params.initiator),
              _initiator_type: params.initiator.type
            };

            
            switch (params.initiator.type) {
              case 'parser':
                {
                  entry._initiator = params.initiator.url;
                  entry._initiator_line = params.initiator.lineNumber + 1; 
                }
                break;

              case 'script':
                {
                  if (
                    params.initiator.stack &&
                    params.initiator.stack.callFrames.length > 0
                  ) {
                    const topCallFrame = params.initiator.stack.callFrames[0];
                    entry._initiator = topCallFrame.url;
                    entry._initiator_line = topCallFrame.lineNumber + 1; 
                    entry._initiator_column = topCallFrame.columnNumber + 1; 
                    entry._initiator_function_name = topCallFrame.functionName;
                    entry._initiator_script_id = topCallFrame.scriptId;
                  }
                }
                break;
            }

            if (params.redirectResponse) {
              const previousEntry = entries.find(
                entry => entry._requestId === params.requestId
              );
              if (previousEntry) {
                previousEntry._requestId += 'r';
                populateEntryFromResponse(
                  previousEntry,
                  params.redirectResponse,
                  page,
                  options
                );
              } else {
                console.log(
                  `Couldn't find original request for redirect response: ${
                    params.requestId
                  }`
                );
              }
            }

            if (!page) {
              console.log(
                `Request will be sent with requestId ${
                  params.requestId
                } that can't be mapped to any page at the moment.`
              );
              
              entriesWithoutPage.push(entry);
              paramsWithoutPage.push(params);
              continue;
            }

            entries.push(entry);

            
            addFromFirstRequest(page, params);
       
            const entrySecs =
              page.__wallTime + (params.timestamp - page.__timestamp);
            entry.startedDateTime = dayjs.unix(entrySecs).toISOString();
          }
          break;

        case 'Network.requestServedFromCache':
          {
            if (pages.length < 1) {
           
              continue;
            }

            if (ignoredRequests.has(params.requestId)) {
              continue;
            }

            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );
            if (!entry) {
              console.log(
                `Received requestServedFromCache for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            entry.__servedFromCache = true;
            entry.cache.beforeRequest = {
              lastAccess: '',
              eTag: '',
              hitCount: 0
            };
          }
          break;

        case 'Network.requestWillBeSentExtraInfo':
          {
            if (ignoredRequests.has(params.requestId)) {
              continue;
            }

            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );
            if (!entry) {
              console.log(
                `Extra info sent for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            if (params.headers) {
              entry.request.headers = entry.request.headers.concat(
                parseHeaders(params.headers)
              );
            }

            if (params.associatedCookies) {
              entry.request.cookies = (entry.request.cookies || []).concat(
                params.associatedCookies
                  .filter(({ blockedReasons }) => !blockedReasons.length)
                  .map(({ cookie }) => formatCookie(cookie))
              );
            }
          }
          break;

        case 'Network.responseReceivedExtraInfo':
          {
            if (pages.length < 1) {
            
              continue;
            }

            if (ignoredRequests.has(params.requestId)) {
              continue;
            }

            let entry = entries.find(
              entry => entry._requestId === params.requestId
            );

            if (!entry) {
              entry = entriesWithoutPage.find(
                entry => entry._requestId === params.requestId
              );
            }

            if (!entry) {
              console.log(
                `Received response extra info for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            if (!entry.response) {
            
              entry.extraResponseInfo = {
                headers: parseHeaders(params.headers),
                blockedCookies: params.blockedCookies
              };
              continue;
            }

            if (params.headers) {
              entry.response.headers = entry.response.headers.concat(
                parseHeaders(params.headers)
              );
            }
          }
          break;

        case 'Network.responseReceived':
          {
            if (pages.length < 1) {
              
              responsesWithoutPage.push(params);
              continue;
            }

            if (ignoredRequests.has(params.requestId)) {
              continue;
            }

            let entry = entries.find(
              entry => entry._requestId === params.requestId
            );

            if (!entry) {
              entry = entriesWithoutPage.find(
                entry => entry._requestId === params.requestId
              );
            }

            if (!entry) {
              console.log(
                `Received network response for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            const frameId =
              rootFrameMappings.get(params.frameId) || params.frameId;
            const page =
              pages.find(page => page.__frameId === frameId) ||
              pages[pages.length - 1];
            if (!page) {
              console.log(
                `Received network response for requestId ${
                  params.requestId
                } that can't be mapped to any page.`
              );
              continue;
            }

            try {
              populateEntryFromResponse(entry, params.response, page, options);
            } catch (e) {
              console.log(
                `Error parsing response: ${JSON.stringify(
                  params,
                  undefined,
                  2
                )}`
              );
              throw e;
            }
          }
          break;

        case 'Network.dataReceived':
          {
            if (pages.length < 1) {
              
              continue;
            }
            if (ignoredRequests.has(params.requestId)) {
              continue;
            }

            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );
            if (!entry) {
              console.log(
                `Received network data for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }
          
            if (entry.response) {
              entry.response.content.size += params.dataLength;
            }
          }
          break;

        case 'Network.loadingFinished':
          {
            if (pages.length < 1) {
              
              continue;
            }
            if (ignoredRequests.has(params.requestId)) {
              ignoredRequests.delete(params.requestId);
              continue;
            }

            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );
            if (!entry) {
              console.log(
                `Network loading finished for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            finalizeEntry(entry, params);
          }
          break;

        case 'Page.loadEventFired':
          {
            if (pages.length < 1) {
              
              continue;
            }

            const page = pages[pages.length - 1];

            if (params.timestamp && page.__timestamp) {
              page.pageTimings.onLoad = formatMillis(
                (params.timestamp - page.__timestamp) * 1000
              );
            }
          }
          break;

        case 'Page.domContentEventFired':
          {
            if (pages.length < 1) {
              
              continue;
            }

            const page = pages[pages.length - 1];

            if (params.timestamp && page.__timestamp) {
              page.pageTimings.onContentLoad = formatMillis(
                (params.timestamp - page.__timestamp) * 1000
              );
            }
          }
          break;

        case 'Page.frameAttached':
          {
            const frameId = params.frameId,
              parentId = params.parentFrameId;

            rootFrameMappings.set(frameId, parentId);

            let grandParentId = rootFrameMappings.get(parentId);
            while (grandParentId) {
              rootFrameMappings.set(frameId, grandParentId);
              grandParentId = rootFrameMappings.get(grandParentId);
            }
          }
          break;

        case 'Network.loadingFailed':
          {
            if (ignoredRequests.has(params.requestId)) {
              ignoredRequests.delete(params.requestId);
              continue;
            }

            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );
            if (!entry) {
              console.log(
                `Network loading failed for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            if (params.errorText === 'net::ERR_ABORTED') {
              finalizeEntry(entry, params);
              console.log(
                `Loading was canceled due to Chrome or a user action for requestId ${
                  params.requestId
                }.`
              );
              continue;
            }

            
            console.log(
              `Failed to load url '${entry.request.url}' (canceled: ${
                params.canceled
              })`
            );
            entries = entries.filter(
              entry => entry._requestId !== params.requestId
            );
          }
          break;

        case 'Network.resourceChangedPriority':
          {
            const entry = entries.find(
              entry => entry._requestId === params.requestId
            );

            if (!entry) {
             console.log(
                `Received resourceChangedPriority for requestId ${
                  params.requestId
                } with no matching request.`
              );
              continue;
            }

            entry._priority = message.params.newPriority;
          }
          break;

        default:
          
          ignoredEvents(method);
          break;
      }
    }

    if (!options.includeResourcesFromDiskCache) {
      entries = entries.filter(
        entry => entry.cache.beforeRequest === undefined
      );
    }

    const deleteInternalProperties = o => {
      
      for (const prop in o) {
        if (prop.startsWith('__')) {
          delete o[prop];
        }
      }
      return o;
    };

    entries = entries
      .filter(entry => {
        if (!entry.response) {
          console.log(`Dropping incomplete request: ${entry.request.url}`);
        }
        return entry.response;
      })
      .map(deleteInternalProperties);
    pages = pages.map(deleteInternalProperties);
    pages = pages.reduce((result, page, index) => {
      const hasEntry = entries.some(entry => entry.pageref === page.id);
      if (hasEntry) {
        result.push(page);
      } else {
        console.log(`Skipping empty page: ${index + 1}`);
      }
      return result;
    }, []);
    const pagerefMapping = pages.reduce((result, page, index) => {
      result[page.id] = `page_${index + 1}`;
      return result;
    }, {});

    pages = pages.map(page => {
      page.id = pagerefMapping[page.id];
      return page;
    });
    entries = entries.map(entry => {
      entry.pageref = pagerefMapping[entry.pageref];
      return entry;
    });



    return {
      log: {
        version: '1.2',
        creator: { name, version, comment: "Generated by HAR extension v.1.0" },
        pages,
        entries
      }
    };
  }
  
  function addFromFirstRequest(page, params) {
  if (!page.__timestamp) {
    page.__wallTime = params.wallTime;
    page.__timestamp = params.timestamp;
    page.startedDateTime = dayjs.unix(params.wallTime).toISOString(); 
   
    page.title = page.title === '' ? params.request.url : page.title;
  }
}

function str2bytes (str) {
   var bytes = new Uint8Array(str.length);
   for (var i=0; i<str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}


function setUserAgent(userAgent, pages)
{
	chrome.webRequest.onBeforeSendHeaders.addListener(
		function(info) {
			// Replace the User-Agent header
			var headers = info.requestHeaders;
			headers.forEach(function(header, i) {
				if (header.name.toLowerCase() == 'user-agent') { 
					header.value = userAgent;
				}
			});  
			return {requestHeaders: headers};
		},
		// Request filter
		{
			// Modify the headers for these pages = array of strings
			urls: pages,
			// In the main window and frames
			types: ["main_frame", "sub_frame"]
		},
		["blocking", "requestHeaders"]
	);
}

var testtime = 0;
var base64_har;
chrome.tabs.onUpdated.addListener(function(tid, changeInfo, tab){
       
	if(localStorage._active === "true")
	{	
		if(testtime == 0) testtime = new Date(Date.now());
		if( tab.id == parseInt(localStorage._tabid) && changeInfo.status === "complete") 
		{
			console.log("generating har ...");
			chrome.storage.sync.get(null, function(items) {
				  
				chrome.browserAction.setIcon({tabId: parseInt(localStorage._tabid), path:"debuggerPause.png"});
				chrome.browserAction.setTitle({tabId: parseInt(localStorage._tabid), title:"Stop"});
				
				har = harFromMessages(_events, {includeTextFromResponseBody: true, includeResourcesFromDiskCache: true});
				var testduration = Math.round(((new Date(Date.now())) - testtime)/1000);
				// testtime = 0;
				testtime = Math.round((new Date()).getTime() / 1000);
				//console.log(har);
				chrome.storage.local.set({['har_'+localStorage._count]: har });
				localStorage._count = parseInt(localStorage._count)+1;
				if(parseInt(localStorage._count) > 4) localStorage._count = "0";
				
				if(items.address.length > 0)
				 {
					if(items.method === "GET")
					{
						let url = new URL(items.address+'/api/remoteviewresultupload.json');
						url.searchParams.set("har", encodeURIComponent(har));
						var req = new XMLHttpRequest();
						req.open("GET", url, true);
						req.onreadystatechange = function (oEvent) {
							if (req.readyState === 4) {
								if (req.status === 200) {
								  console.log(req.responseText)
								} else {
								   console.log("Error", req.statusText);
								}
							}
						};
						req.send(null);
					}
					else
					if(items.method === "POST")
					{
						var part1,part2;
						var request = new XMLHttpRequest();
							request.open('GET', 'html-part1.tmp', false);
							request.send(null);
							if (request.status === 200) {
							  part1 = request.responseText;
							}
							request = new XMLHttpRequest();
							request.open('GET', 'html-part2.tmp', false);
							request.send(null);
							if (request.status === 200) {
							  part2 = request.responseText;
							}
	
						var data = new FormData();
						data.append('computer_name', items.computername);
						data.append('user_name', items.username);
						data.append('test_time', testtime);
						data.append('test_duration', testduration);
						data.append('test_result_type', "success");
						// data.append('test_type', "ExtensionHAR");
						data.append('test_type', "web-waterfall");
						data.append('note', "Web page waterfall for "+tab.url);
						// data.append('session_id', uuid);
						data.append('session_id', "CHROME-"+uuid);
						data.append('test_result_size', 0);
						// data.append('test_result_compressed_size', 0);
						data.append('test_result_compressed', "none");
            var blob = new Blob([str2bytes(part1+JSON.stringify(har)+part2)], {type: "application/octet-stream"});
            if (blob) { 
              let reader = new FileReader(); 
              reader.onload = function (event) {  
                  base64_har = event.target.result
                  // console.log(base64_har);
              }; 
              reader.readAsDataURL(blob); 
            } 
            data.append("file", blob, "RemoteView™ Chrome Waterfall for "+(new URL(tab.url).hostname));
            // data.append("file", base64_har, "RemoteView™ Chrome Waterfall for "+(new URL(tab.url).hostname));
						data.set('test_result_size', blob.size);
						var req = new XMLHttpRequest();
						req.open('POST', items.address+'/api/remoteviewresultupload.json', true);
						//req.setRequestHeader('User-Agent','XMLHTTP/1.0');
						req.onload = function () {
							//console.log(this.responseText);
						};
						req.send(data);
						
					}
				 }
			});
		}
		
		
	}
        
});
