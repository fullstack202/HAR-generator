
var finalizeEntry = function(entry, params) {
  const timings = entry.timings || {};
  timings.receive = formatMillis(
    (params.timestamp - entry._requestTime) * 1000 - entry.__receiveHeadersEnd
  );
  entry.time =
    max(0, timings.blocked) +
    max(0, timings.dns) +
    max(0, timings.connect) +
    max(0, timings.send) +
    max(0, timings.wait) +
    max(0, timings.receive);

  if (params.encodedDataLength >= 0) {
    const response = entry.response;
    if (response) {
      response._transferSize = params.encodedDataLength;
      response.bodySize = params.encodedDataLength;

      if (isHttp1x(response.httpVersion) && response.headersSize > -1) {
        response.bodySize -= response.headersSize;
      }

      const compression = Math.max(
        0,
        response.content.size - response.bodySize
      );
      if (compression > 0) {
        response.content.compression = compression;
      }
    }
  }
};
