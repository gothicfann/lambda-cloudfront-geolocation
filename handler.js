"use strict";

const util = require("util");
const Cookie = require("cookie");
const Reader = require("mmdb-reader");
const DOMAIN = "testbixtrim.tk"; 

// edgeRedirect solves the Cloudfront website use-case

/*
  Typical Cloudfront event structure to consume:
  {
    "Records": [
      {
        "cf": {
          "request": {
            "uri": "/test",
            "headers": {
              "cloudfront-viewer-country": [
                {
                  key: "Cloudfromt-Viewer-Country",
                  value: "FR"
                }
              ]
            }
          }
        }
      }
    ]
  }
*/

module.exports.edgeRedirect = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const uri = request.uri;
  const countryCode = headers["cloudfront-viewer-country"][0].value;
//  const domain = request.headers.host.replace('http://','').replace('https://','');	

  console.log(`Country detected: '${countryCode}'`);
  if(uri.trim() === "/"){
    let response = {
      status: "302",
      statusDescription: "Found",
      headers: {
        location: [
          {
            key: "Location",
            value: `https://${DOMAIN}/en`
          }
        ]
      }
    };
  
    if (countryCode == "GE") {
      response.headers.location[0].value = `https://${DOMAIN}/ka`	
    }
  

    callback(null,response);
  }else{
    callback(null,request);
  }
};

// countryLookup solves all non-CloudFront use-cases, such as mobile

module.exports.countryLookup = (
  { requestContext },
  ctx,
  callback
) => {
  let ip =
    requestContext &&
    requestContext.identity &&
    requestContext.identity.sourceIp
      ? requestContext.identity.sourceIp
      : callback(null, { statusCode: 422, body: "Unprocessable Request" });

  Reader.open(__dirname + "/data/GeoLite2-Country.mmdb", (error, reader) => {
      
  if (error) {
   callback(error);
  }else {
      let { iso_code, is_in_european_union } = reader.lookup(ip).country;
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          iso_code,
          is_in_european_union: is_in_european_union || false
        })
      });
    }
  });
};
