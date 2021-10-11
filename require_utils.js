
const isEmpty = o => !o;

var require_utils = function () {
   return {	
  isHttp1x(version) {
    return version.toLowerCase().startsWith('http/1.');
  },

  formatMillis(time, fractionalDigits = 3) {
    return Number(Number(time).toFixed(fractionalDigits));
  },
  toNameValuePairs(object) {
    return Object.keys(object).reduce((result, name) => {
      const value = object[name];
      if (Array.isArray(value)) {
        return result.concat(
          value.map(v => {
            return { name, value: v };
          })
        );
      } else {
        return result.concat([{ name, value }]);
      }
    }, []);
  },
  parseUrlEncoded(data) {
    const params = urlParser.parse(`?${data}`, true).query;
    return this.toNameValuePairs(params);
  },
  parsePostData(contentType, postData) {
    if (isEmpty(contentType) || isEmpty(postData)) {
      return undefined;
    }

    try {
      if (/^application\/x-www-form-urlencoded/.test(contentType)) {
        return {
          mimeType: contentType,
          params: this.parseUrlEncoded(postData)
        };
      }
      if (/^application\/json/.test(contentType)) {
        return {
          mimeType: contentType,
          params: this.toNameValuePairs(JSON.parse(postData))
        };
      }
      // FIXME parse multipart/form-data as well.
    } catch (e) {
      console.log(`Unable to parse post data '${postData}' of type ${contentType}`);
      // Fall back to include postData as text.
    }
    return {
      mimeType: contentType,
      text: postData
    };
  },
  isSupportedProtocol(url) {
    return /^https?:/.test(url);
  }
   }
};
